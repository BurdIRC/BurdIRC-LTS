class ControlServer{
    constructor(e) {
        const _self = this;
        this.ipc = require('electron').ipcRenderer;
        this.ipc.on('control', function(event, response){
            console.log(response);
            _self.onData({data: response});
        });
        
        this.ipc.send('control', '["o"]');
        
        setTimeout(function(){
            _self.onOpen({});
        },100);
        
        
        /*
        const _self = this;
        this.serverURL = e.serverURL;

        this.ws = new WebSocket(this.serverURL);
        this.ws.onmessage = function(e){_self.onData(e)};
        this.ws.onopen = function(e){_self.onOpen(e)};
        this.ws.onclose = function(e){_self.onClose(e)};
        this.ws.onerror = function(e){_self.onError(e)};
        this.sid = "";
        
        setTimeout(()=>{
           if (this.ws.readyState !== 1) {
               this.onError(500);
           }
        }, 5000);

        this.connected = false;
        */
    }
    
    onData(e){
        
        console.log(e.data);
        
        const type = e.data.substr(0,1);
        
        switch(type){
            case "o":
                this.connected = true;
                this.sendData(0, "CONTROL START");
                break;
            case "v":
                version = e.data.split(" ")[0].substr(1);
                release = e.data.split(" ")[1];
                break;
            case "s":
                this.sid = e.data.substr(1);
                log("Websocket ID is " + this.sid);
                break;
            case "r":
                if(e.data.split(" ")[1] == "0"){
                    /* backend restore has failed */
                    for(var i in networks){
                        networks[i].disconnected();
                    }
                }
                break;
            case "a":
                const data = JSON.parse(e.data.substr(1))[0];
                const id = data.substr(1).split(" ")[0];
                networks[id].parseData(data);
                break;
        }
    }
    
    onOpen(e){
        if(this.sid != ""){
            this.sendData(0, "RESTORE " + this.sid);
            for(var i in networks){
                networks[i].bgconnect();
                this.reconnecting = true;
            }
        }
        log("Websocket connection created");
        setTimeout(function(){
            for(let i in servers){
                if(servers[i].onStartup){
                    setTimeout(function(){
                        connectNetwork(servers[i].guid);
                    },100 * i);
                }
            }
        },2000);
    }
    
    onClose(e){
        
    }
    
    onError(e){
        
    }
    
    sendData(svr, data){
        /*
        if(data == "") return this.ws.send(JSON.stringify([":" + svr]));
        this.ws.send(JSON.stringify([":" + svr + " " + data]));
        */
        if(data == "") return this.ipc.send('control', JSON.stringify([":" + svr]));
        this.ipc.send('control', JSON.stringify([":" + svr + " " + data]));
    }
}

let cs = null; 

function setupControlSocket(){
    log("Creating new websocket connection");
    let tsid = cs ? cs.sid : "";
    cs = new ControlServer({serverURL: "ws://" + location.href.split("/")[2] + "/ws"});
    cs.sid = tsid;
    cs.onClose = function(e){
        setTimeout(function(){
            setupControlSocket();
        }, 2000);
        
        log("Websocket connection failed");
        
        for(var i in networks){
            networks[i].bgdisconnect();
            this.reconnecting = true;
        }
    };
}

setupControlSocket();