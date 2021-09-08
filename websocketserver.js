const WebSocket = require('ws');
const net = require('net');
const tls = require('tls');
const pjson = require('./package.json');
const settings = require('./config.json');

const controls = [];

let doClose = false;

function getControl(sid,id){
	for(let i in controls){
		if(controls[i].sid == sid && controls[i].id == id) return controls[i];
	}
	return false;
}

function isControl(sid){
	for(let i in controls){
		if(controls[i].sid == sid) return true;
	}
	return false;
}


function removeControl(sid){
	for(let i in controls){
        if(controls[i].client) controls[i].client.write("QUIT :Burd IRC burdirc.haxed.net\r\n");
        if(controls[i].client) controls[i].client.destroy();
	}
	return false;
}

function flushCache(sid){
	for(let i in controls){
        if(controls[i].sid == sid){
            if(controls[i].cache.length > 0){
                for(let j in controls[i].cache){
                    controls[i].ws.send(controls[i].cache[k]);
                }
                controls[i].cache = [];
            }
        }
	}
    return false;
}

function setControl(sid,ws){
	for(let i in controls){
		if(controls[i].sid == sid) controls[i].ws = ws;
	}
	return false;
}

const wsServer = {
	wss: new WebSocket.Server({noServer: true}),
	handle: (request, socket, head) => {
		wsServer.wss.handleUpgrade(request, socket, head, function connection(ws) {
			log("New websocket connection");
            doClose = false;
            let sid = randomID(); 
            ws.send("v" + pjson.version + " " + settings.channel);
            
            setTimeout(function(){
                ws.send("s" + sid);
            },100);
            
			ws.on('message', function incoming(message) {
                try{
                    const j = JSON.parse(message);
                    for(let i in j){
                        if(j[i].substr(0,1) == ":"){
                            let data = j[i].substr(1);
                            const bits = data.split(" ");
                            const ubits = data.toUpperCase().split(" ");
                            log("Data: " + data);
                            if(data.match(/^([1-9])$/ig) != null){
                                ws.send('a[":' + data + '"]');
                                controls.push({sid: sid, ws: ws, id: parseInt(bits[0]), client: false, cache: [], data: "", cache: [], cert:"", key: "", send: function(e){
                                    if(this.ws.readyState == 1){
                                        this.ws.send(e);
                                    }else{
                                        this.cache.push(e);
                                    }
                                }});
                                
                            }else{
                                if(bits[0] == "0"){
                                    if(bits[1] == "RESTORE"){
                                        log("RESTORE CONNECTION " + bits[2]);
                                        if(isControl(bits[2])){
                                            setControl(bits[2],ws);
                                            sid = bits[2];
                                            ws.send("r 1 " + bits[2]);
                                            flushCache(sid);
                                            
                                        }else{
                                            ws.send("r 0 " + bits[2]);
                                        }
                                    }else if(bits[1] == "CLOSED"){
                                        removeControl(sid);
                                    }
                                }else if(bits[0].match(/^([1-9])$/ig) != null){
                                    let control = getControl(sid,bits[0]);
                                    if(control){
                                        if(control.client){
                                            log(">>" + data.substr(2));
                                            control.client.write(data.substr(2) + "\r\n");
                                        }else{
                                            switch(bits[1]){
                                                case "CERT":
                                                    const certData = Buffer.from(bits[2], 'base64').toString();
                                                    if(certData.indexOf("-----END CERTIFICATE-----") > -1 && certData.indexOf("PRIVATE KEY-----") > -1){
                                                        const cert = certData.split("-----END CERTIFICATE-----")[0] + "-----END CERTIFICATE-----";
                                                        const certKey = certData.split("-----END CERTIFICATE-----")[1];
                                                        
                                                        control.cert = cert;
                                                        control.key = certKey;
                                                    }
                                                    break;
                                                case "HOST":
                                                    if(control.client) return; /* do not accept HOST for a control already connected */
                                                    const host = bits[2].split(":");
                                                    let client = new net.Socket();
                                                    if(host[1].substr(0,1) == "+"){
                                                        /* port starts with + so it's ssl */
                                                        let options = {rejectUnauthorized: false};
                                                        if(control.cert != ""){
                                                            options.cert = control.cert;
                                                            options.key = control.key;
                                                        }
                                                        client = tls.connect({port:host[1].substr(1), host: host[0], options}, function() {
                                                            control.ws.send('a[":' + control.id + ' control connected"]');
                                                            control.client = client;
                                                            for(let z in control.cache){
                                                                control.client.write(control.cache[z] + "\r\n");
                                                            }
                                                            control.cache = [];
                                                        });
                                                        log("SSL Connection");
                                                    }else{
                                                        client.connect(host[1], host[0], function() {
                                                            control.ws.send('a[":' + control.id + ' control connected"]');
                                                            control.client = client;
                                                            for(let z in control.cache){
                                                                control.client.write(control.cache[z] + "\r\n");
                                                            }
                                                            control.cache = [];
                                                        });
                                                    }
                                                    client.on('data', function(data) {
                                                        control = getControl(sid,bits[0]);
                                                        data = data.toString().replace(/\r/g, "");
                                                        control.data = control.data + data;
                                                        if(control.data.slice(-1) == "\n" && control.ws.readyState == 1){
                                                            const parts = control.data.split("\n");
                                                            for(let i in parts){
                                                               if(parts[i].length > 0) control.ws.send("a" + JSON.stringify([":" + control.id + " " + parts[i]]));
                                                            }
                                                            control.data = "";
                                                        }
                                                    });
                                                    client.on('close', function() {
                                                        log('Connection closed');
                                                        control.client = false;
                                                        control.send("a" + JSON.stringify([":" + control.id + " control closed"]));
                                                        removeControl(control.sid);
                                                    });
                                                    client.on('error', function(err) {
                                                        control.send("a" + JSON.stringify([":" + control.id + " control closed " + err.code]));
                                                        removeControl(control.sid);
                                                    });
                                                    break;
                                                case "ENCODING":
                                                    break;
                                                default:
                                                    control.cache.push(data.substr(2));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }catch(err){
                    log(err);
                    //ws.close();
                }
			});
            
			ws.on('close', function incoming(message) {
				log('Websocket closed');
                /*
				for(let i in controls){
					if(controls[i].ws == ws){
						if(controls[i].client) controls[i].client.write("QUIT :Burd IRC www.burdirc.com\r\n");
						if(controls[i].client) controls[i].client.destroy();
					}
				}
                */
			});
			
			/*
			const client = new net.Socket();
			
			client.connect(8080, "192.168.1.100", function() {
				ws.send('a[":1"]');
			});
			
			controls.push({ws: ws, id: 1, client: client});
			*/
			ws.send('o');
			//ws.send('a[":1"]');


		});
	}
}


function log(e){
    if(settings.verbose) console.log(e);
}

function ip2hex(ip){
	let ip4 = ip.split(".");
	let p,i;
	let hexStr = "";
	for(i=0; i<ip4.length; i++){
		p = new Number(ip4[i]);
		hexStr += p<16?("0"+p.toString(16)):p.toString(16);
	}
	return(hexStr);
}

function randomID() {
    return 'axxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}



module.exports = wsServer;