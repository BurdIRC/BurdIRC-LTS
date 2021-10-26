const fs = require('fs');
const tar = require('tar-fs');
const http = require('http');
const https = require('https');
const httpServer = require("./httpserver.js");
const wsServer = require("./websocketserver.js");
const pjson = require('./package.json');
const cp = require('child_process');

const args = process.argv.slice(2);

const settings = require('./config.json');

if(settings.browser == "edge") settings.browser = "msedge";

const port = settings.serverPort;

function createHttpServer(){
	const server = http.createServer(function (req, res) {
		if(req.url == "/ws"){
			res.writeHead(426, {"Content-Type": 'text/plain'});
			res.write('426 Upgrade Required'); //write a response to the client
			res.end(); //end the response
		}else{
			httpServer.serve(req, res);
		}
	}).listen(port);
	
	server.on('upgrade', function upgrade(request, socket, head) {
		wsServer.handle(request, socket, head);
	});
	
	console.log("BurdIRC server is running on port " + port);
}



console.log("Checking for updates...");

function getUpdate(url,type){
    const file = fs.createWriteStream("update.tar");
    const request = https.get(url, function(response) {
        response.pipe(file);
        console.log("Extracting update file...");
        setTimeout(function(){
            fs.createReadStream('update.tar').pipe(tar.extract('./'));
            console.log("Update complete!");
            if(type == 2){
                console.log("The app has been updated. You'll need to relaunch the it");
            }else{
                createHttpServer();
                startGUI();
            }
            setTimeout(function(){
                fs.unlink("update.tar", function(err){});
            },1000);
        },3000);

    });
}

const upd = https.get('https://burdirc.haxed.net/updates.json', (resp) => {
	let data = '';

	resp.on('data', (chunk) => {
		data += chunk;
	});

	resp.on('error', (err) => {
		console.log("Error");
	});

	resp.on('end', () => {
        try{
            let json = JSON.parse(data);
            if(json.version != pjson.version){
                //update
                console.log("Downloading update " + json.version + "...");
                getUpdate(json.tarball, json.type);
            }else{
                console.log("Current version is the latest");
                createHttpServer();
                startGUI();
            }
        }catch(err){
            console.log("Couldn't check for updates");
            createHttpServer();
            startGUI();
        }
	});

});

upd.on('error', (err) => {
    console.log("Couldn't check for updates");
    createHttpServer();
    startGUI();
});

function startGUI(){
    const start = (process.platform == 'darwin' ? 'open': process.platform == 'win32' ? 'start': 'xdg-open');
    if(settings.appwindow == true){
        setTimeout(function(){
            if(process.platform == "win32"){
                cp.exec(start + " " + settings.browser + " --app=http://localhost:" + port + "/index.html");
            }
        },1000);
    }else{
        console.log("Open the following URL in your web browser: http://localhost:" + port + "/");
    }
}