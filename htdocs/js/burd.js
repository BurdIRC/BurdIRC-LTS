const networks = [];

class IRC{
    constructor(e) {
        const self = this;
        
        this.channels = [
            {type: "console", name: "Console", messages: [
                {type: "info", message: lang.connecting, date: Date.now()}
            ]}
        ];
        
        this.connected = false;
        this.reconnectTimer = 0;
        this.whoPollChannels = [];
        this.pollState = 0;

        this.whoTimer = setInterval(function(){
            if(settings.showIdleStatus){
                if(self.connected && self.pollState == 0 && self.whoPollChannels.length > 0){
                    self.sendData("WHO " + self.whoPollChannels[0]);
                    self.pollState = 1;
                    self.whoPollChannels.splice(0, 1);
                }
            }
        },5000);
        
        this.channelSettings = e.channelSettings;
        
        this.guid = e.guid;
        
        this.reconnecting = false;
        
        this.nick = e.userInfo.nick;
        this.users = [];
        this.network = "Unknown";
        this.connectionID = e.connectionID;
        
        this.server = e.server;
        this.userInfo = e.userInfo;
        
        this.nickServIsService = false;
        this.users = [];
        this.iSupport = {CHANTYPES: "#", CHANMODES: "eIbq,k,flj,CFLMPQScgimnprstuz", PREFIX: "(ov)@+", NETWORK: "Unknown", STATUSMSG: "@+"};
        this.caps = ["CAP-NOTIFY", "USERHOST-IN-NAMES", "ACCOUNT-NOTIFY", "AWAY-NOTIFY", "CHGHOST", "EXTENDED-JOIN", "MULTI-PREFIX"];
    
        this.cache = ""; /* this variable is used for multiple things, as short term holding memory  */
        
        this.callbacks = []; /* callbacks for .on() operations */
        
        this.logging = false;
        
        networks[this.connectionID] = this;
        
        const cleanupTimer = setInterval(function(){
            /* runs every 5 minutes */
            self.cleanup();
        }, 300000);
        
        setTimeout(function(){self.raiseEvent("created", {sender: self});}, 100);
    }
    
    disconnected(){
        let dmsg = "Conenction to the IRC network was lost.";
        const _self = this;
        if(this.server.reconnect){
            dmsg += " Reconnecting in 10 seconds.";
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(()=>{
                _self.addToAll({
                    type: "rplmessage",
                    name: "RECONNECTING",
                    message: "Reconnecting to the server..."
                });
                _self.reconnect();
            },10000);
        }
        this.addToAll({
            type: "error",
            name: "DISCONNECTED",
            message: dmsg
        });
    }
    
    
    reconnect(){
        cs.sendData(this.connectionID, "");
    }
    
    bgdisconnect(){
        this.addToAll({
            type: "error",
            name: "DISCONNECTED",
            message: "Connection to the backend has been lost"
        });
    }
    
    bgconnect(){
        this.addToAll({
            type: "rplmessage",
            name: "CONNECTED",
            message: "Connection to the backend has been restored"
        });
        this.sendData("PING :RUALIVE??");
    }
    
    addToAll(message){
        for(let i in this.channels){
            message.date = Date.now();
            this.channels[i].messages.push(message);
            this.raiseEvent("message", {sender: this, cID: this.connectionID, type: this.channels[i].type, name: this.channels[i].name, message: message});
        }
    }
    
    on(a, b){
        this.callbacks.push([a, b]);
    }
    
    raiseEvent(a, b){
        for(let i in this.callbacks){
            if(this.callbacks[i][0] == a) this.callbacks[i][1](b);
        }
    }
    
    connect(){
        cs.sendData(this.connectionID, "");
    }
    
    getChannel(type, name){
        for(let i in this.channels){
            if(this.channels[i].type == type && this.channels[i].name.toLowerCase() == name.toLowerCase()){
                return this.channels[i];
            }
        }
        return false;
    }
    
    log(e){
        if(this.logging) console.log(e);
    }
    
    addChannel(type, name){
        if(type == "console" || type == "pm"){
            this.channels.push({
                type: type,
                name: name,
                unread: 0,
                messages: []
            });
        }else if(type == "channel"){
            const tc = this.getChannel(type, name);
            if(tc){
                tc.users = [];
                return;
            }
            this.channels.push({
                type: type,
                name: name,
                topic: {text: "", date: 0, user: ""},
                unread: 0,
                messages: [],
                users: []
            });
            
            this.raiseEvent("joined", {sender: this, name: name});
        }
    }
    
    removeServerUser(nick){
        for(let i in this.users){
            if(this.users[i][0].toLowerCase() == nick.toLowerCase()){
                this.users.splice(i, 1);
                break;
            }
        }
    }
    
    setIdleMessage(nick, message, mask){
        for(let i in this.users){
            if(this.users[i][0].toLowerCase() == nick.toLowerCase()){
                this.users[i][2] = message;
                if(mask) this.users[i][1] = mask;
                return true;
            }
        }
        return false;
    }
    
    addServerUser(user, mask){
        for(let i in this.users){
            if(this.users[i][0].toLowerCase() == user.toLowerCase()){
                return;
            }
        }
        this.users.push([user, mask, ""]);
    }
    
    getServerUser(nick){
        for(let i in this.users){
            if(this.users[i][0].toLowerCase() == nick.toLowerCase()){
                return this.users[i];
            }
        }
        return [];
    }
    
    addChannelMessage(type, name, message){
        for(let i in this.channels){
            if(this.channels[i].type == type && this.channels[i].name.toLowerCase() == name.toLowerCase()){
                message.date = Date.now();
                this.channels[i].messages.push(message);
                this.log(message);
                this.raiseEvent("message", {sender: this, cID: this.connectionID, type: type, name: name, message: message});
                return true;
            }
        }
        return false;
    }
    
    userFlags(e){
        const flags = this.iSupport.PREFIX.split(")")[1].split("");
        let foundFlags = "";
        let realNick = e;
        
        for(let i in flags){
            if(e.indexOf(flags[i]) > -1) foundFlags += flags[i];
            realNick = realNick.replace(flags[i], "");
        }
        return {nick: realNick, flags: foundFlags};
    }
    
    joinUser(type, channel, nick, mask){
        this.addChannelMessage(type, channel, {
            type: "userjoin",
            nick: nick,
            mask: mask
        });
        this.addServerUser(nick, mask);
        const chan = this.getChannel(type, channel);
        chan.users.push([nick, ""]);
        this.raiseEvent("join", {sender: this, cID: this.connectionID, type: type, name: channel, nick: nick, mask: mask});
    }
    
    partUser(type, channel, nick, mask, message){
        this.addChannelMessage(type, channel, {
            type: "userpart",
            nick: nick,
            mask: mask,
            message: message
        });
        
        const chan = this.getChannel(type, channel);
        
        if(chan){
            for(let j in chan.users){
                if(chan.users[j][0].toLowerCase() == nick.toLowerCase()){
                    chan.users.splice(j, 1);
                    this.raiseEvent("part", {sender: this, cID: this.connectionID, type: type, name: channel, nick: nick, mask: mask, message: message});
                    return;
                }
            }
        }
    }
    
    kickUser(kicker, channel, kicked, message){
        this.log(channel);
        this.addChannelMessage("channel", channel, {
            type: "userkicked",
            kicker: kicker,
            name: channel,
            kicked: kicked,
            message: message
        });
        
        const chan = this.getChannel("channel", channel);
        
        if(chan){
            for(let j in chan.users){
                if(chan.users[j][0].toLowerCase() == kicked.toLowerCase()){
                    chan.users.splice(j, 1);
                    this.raiseEvent("kicked", {sender: this, cID: this.connectionID, type: "channel", n: channel, kicker: kicker, kicked: kicked, message: message});
                    return;
                }
            }
        }
    }
    
    getChannel(type, channel){
        for(let i in this.channels){
            if(this.channels[i].name.toLowerCase() == channel.toLowerCase() && this.channels[i].type == type){
                return this.channels[i];
            }
        }
        if(type == "pm") this.channels.push({"type": type,"name": channel,"unread": 0,"messages": []});
    }
    
    sortsChannelUsers(channel){
        const chan = this.getChannel("channel", channel);
        
		chan.users = chan.users.sort(function (a,b) {
			var modes = '~&@%+';
			var rex = new RegExp('^['+modes+']');
			var nicks = [(a[1] + a[0].replace(rex,'').toLowerCase()), (b[1] + b[0].replace(rex,'').toLowerCase())];
			var prefix = [];
			if (rex.test(a[1])) prefix.push(modes.indexOf(a[1][0])); 
				else prefix.push(modes.length+1);
			if (rex.test(b[1])) prefix.push(modes.indexOf(b[1][0])); 
				else prefix.push(modes.length+1);
			if (prefix[0] < prefix[1]) return -1;
			if (prefix[0] > prefix[1]) return 1;
			if (nicks[0] > nicks[1]) return 1;
			if (nicks[0] < nicks[1]) return -1;
			return 0;
		});
    }
    
    nickChange(nick, newNick){

        for(let i in this.channels){
            for(let j in this.channels[i].users){
                if(this.channels[i].users[j][0].toLowerCase() == nick.toLowerCase()){
                    this.channels[i].users[j][0] = newNick;
                    this.addChannelMessage(this.channels[i].type, this.channels[i].name, {
                        type: "nickchange",
                        nick: nick,
                        newNick: newNick
                    });
                    break;
                }
            }
        }
        
        for(let i in this.users){
            if(this.users[i][0].toLowerCase() == nick.toLowerCase()){
                this.users[i][0] = newNick;
                this.users[i][1] = newNick + "!" + this.users[i][1].split("!")[1];
                break;
            }
        }
        
        if(nick.toLowerCase() == this.nick.toLowerCase()) this.nick = newNick;
        
    }
    
    quitUser(nick, mask, message){
        
        for(let i in this.channels){
            for(let j in this.channels[i].users){
                if(this.channels[i].users[j][0].toLowerCase() == nick.toLowerCase()){
                    this.channels[i].users.splice(j, 1);
                    this.addChannelMessage(this.channels[i].type, this.channels[i].name, {
                        type: "userquit",
                        nick: nick,
                        mask: mask,
                        message: message
                    });
                    break;
                }
            }
        }
        
        this.removeServerUser(nick);
        this.raiseEvent("quit", {sender: this, nick: nick, message: message});


    }
    
    cleanup(){
        /* this function is ran every 5 minutes. It cleans up the users array among other things */
        
        /* collect users in all channels and put them in an array */
        const allUsers = [];
        
        for(let i in this.channels){
            for(let j in this.channels[i].users){
                allUsers.push(this.channels[i].users[j][0].toLowerCase());
            }
        }
        
        /*
            now we have an array of all users in all channels so now we
            loop through the main users array and remove everyone thats 
            not in a channel anymore
        */
        for(let i in this.users){
            if(!allUsers.includes(this.users[i][0].toLowerCase())){
                this.removeServerUser(this.users[i][0]);
            }
        }
        
        
    }
    
    sendData(data){
        cs.sendData(this.connectionID, data);
    }
    
    parseData(data){
        const self = this;
        const cID = data.substr(1).split(" ")[0];
        const packet = data.substr(data.indexOf(" ") + 1);
        const ubits = packet.toUpperCase().split(" ");
        const bits = packet.split(" ");
        /* cData is all data after ":", if ":" doesn't exist then it will be the last bit of data */
        let cData = (packet.indexOf(" :") > -1) ? packet.substr(packet.indexOf(" :")+2) : bits[bits.length - 1];
        
        if(capture.cid == cID){
            if(capture.window){
                if(packet.match(capture.regex)){
                    capture.window.postMessage({c: "packet", data: packet}, '*');
                    return;
                }
            }
        }
        
        let channel = false;
        let user = false;
        let chanSettings = false;
        
        
        const addInfo = function(e){
            if(GUI.current.cID == self.connectionID){
                self.addChannelMessage(GUI.current.type, GUI.current.name, e);
            }else{
                self.addChannelMessage("console", "console", e);
            }
        }
        const isChannel = function(e){
            if(e.substr(0,1) == "#") return true;
            return false;
        }
        const formatUser = function(e){
            if(e.substr(0,1) == ":") e = e.substr(1);
            const parts = e.split(/\!|\@/g);
            return {nick: parts[0], ident: parts[1], host: parts[2], mask: e};
        }
        const processMode = function(){
            
            const usr = formatUser(bits[0]);
            const modes = bits[3].split("");
            const args = data.substr(bits[0].length + bits[1].length + bits[2].length + bits[3].length + 7).split(" ");

            let state = true;
            
            if( isChannel(bits[2]) ){
                channel = self.getChannel("channel", bits[2]);
                /* modes for channel */
                for(let i in modes){
                    if(args[0] && args[0].substr(0,1) == ":") args[0] = args[0].substr(1);
                    
                    switch(modes[i]){
                        case ":": break;
                        case "+": state = true; break;
                        case "-": state = false; break;
                        
                        case "o":
                            for(let a in channel.users){
                                if(channel.users[a][0].toLowerCase() == args[0].toLowerCase()){
                                    if(state){
                                        channel.users[a][1] += "@";
                                    }else{
                                        channel.users[a][1] = channel.users[a][1].replace("@", "");
                                    }
                                    args.splice(0, 1);
                                    break;
                                }
                            }
                            break;
                            
                        case "v":
                            for(let a in channel.users){
                                if(channel.users[a][0].toLowerCase() == args[0].toLowerCase()){
                                    if(state){
                                        console.log("voiced");
                                        channel.users[a][1] += "+";
                                    }else{
                                        channel.users[a][1] = channel.users[a][1].replace("+", "");
                                    }
                                    args.splice(0, 1);
                                    break;
                                }
                            }
                            break;
                            
                        case "h":
                            for(let a in channel.users){
                                if(channel.users[a][0].toLowerCase() == args[0].toLowerCase()){
                                    if(state){
                                        console.log("voiced");
                                        channel.users[a][1] += "~";
                                    }else{
                                        channel.users[a][1] = channel.users[a][1].replace("~", "");
                                    }
                                    args.splice(0, 1);
                                    break;
                                }
                            }
                            break;
                            
                    }
                }
                
                for(let a in channel.users){
                    if(channel.users[a][1] != ""){
                        let tmode = "";
                        let order = ["%", "@", "~", "+"];
                        const mm = channel.users[a][1].split("");
                        for(let i in order){
                            if(channel.users[a][1].indexOf(order[i]) > -1){
                                tmode += order[i];
                            }
                        }
                        channel.users[a][1] = tmode;
                    }
                }
                
                self.sortsChannelUsers(bits[2]);
                
                self.addChannelMessage("channel", bits[2],{
                    type: "chanmode",
                    channel: bits[2],
                    setter: usr.nick,
                    modes: bits[3],
                    args: ( bits[4] || "" )
                });
            }else{
                /* modes for user */
                if(bits[2].toLowerCase() == self.nick.toLowerCase()){
                    /* it's our owm modes */
                    self.addChannelMessage("console", "Console",{
                        type: "info",
                        message: "modes for " + self.nick + ": " + bits[3].replace(":", "")
                    });
                }
            }
        }
        

        

        
        if(data == ":" + cID){
            if(this.server.TLS) cs.sendData(cID, "CERT " + this.server.cert);
            if(this.server.TLS){
                cs.sendData(cID, "HOST " + this.server.address + ":+" + this.server.port);
            }else{
                cs.sendData(cID, "HOST " + this.server.address + ":" + this.server.port);
            }
            cs.sendData(cID, "ENCODING utf8");
            cs.sendData(cID, "CAP LS 307");
            cs.sendData(cID, "NICK " + this.userInfo.nick);
            cs.sendData(cID, "USER " + this.userInfo.ident + " 0 * " + this.userInfo.name);
            return;
        }
        
        switch(ubits[0]){
            case "PING":
                cs.sendData(cID, "PONG :" + cData);
                break;
                
            case "AUTHENTICATE":
                if(cData == "+"){
                    const chr0 = String.fromCharCode(0);
                    cs.sendData(cID, "AUTHENTICATE " + btoa(this.userInfo.auth.username + chr0 + this.userInfo.auth.username + chr0 + this.userInfo.auth.password));
                }
                break;
                
            case "CONTROL":
                if(ubits[1] == "CONNECTED"){
                    this.raiseEvent("connected", {sender: this});
                    this.addChannelMessage("console", "Console",{
                        type: "info",
                        message: lang.connected
                    });
                    
                    if(this.server.password != ""){
                        cs.sendData(cID, "PASS :" + this.server.password);
                    }
                    
                    if(this.userInfo.auth.type == "sasl plain"){
                        log("Sending SASL Plain auth info");
                        this.caps.push("sasl=PLAIN");
                    }
                    
                }else if(ubits[1] == "ERROR"){
                }else if(ubits[1] == "CLOSED"){
                    if(ubits.length == 2){
                        this.disconnected();
                    }
                }
                break;
            
        }
        
        switch(ubits[1]){
			
			case E.RPL_WELCOME:
                this.raiseEvent("welcome", {sender: this});
                this.addChannelMessage("console", "console", {
                    type: "rplmessage",
                    name: "RPL_WELCOME",
                    message: cData
                });
                this.nick = bits[2];
                this.connected = true;
                if(this.userInfo.auth.type == "nickserv") cs.sendData(cID, "PRIVMSG NICKSERV :identify " + this.userInfo.auth.username + " " + this.userInfo.auth.password);
				
                setTimeout(function(){
                    const joinChannels = [];
                    for(let i in self.channelSettings){
                        if(self.channelSettings[i].auto_join == true){
                            joinChannels.push(i);
                        }
                    }
                    if(joinChannels.length > 0) cs.sendData(cID, "JOIN " + joinChannels.join(","));
                },3000);
                
                break;
                
                
            case E.RPL_MYINFO:
            case E.RPL_BOUNCE:
            case E.RPL_ADMINME:
            case E.RPL_CHANNELMODEIS:
            case E.RPL_CREATIONTIME:
            case E.RPL_INVITELIST:
            case E.RPL_EXCEPTLIST:
            case E.RPL_REHASHING:
            case E.ERR_USERNOTINCHANNE:
            case E.ERR_USERONCHANNEL:
            case E.RPL_LOGGEDIN:
            case E.RPL_UMODEIS:
                let nrt = "";
                for (let i = 2; i < 100; i++) {
                  if(i < bits.length - 1) nrt += bits[i] + " ";
                }
                this.addChannelMessage("console", "console", {
                    type: "rplmessage",
                    name: getEnum(bits[1]),
                    message: nrt
                });
                break;
                
            case E.RPL_MOTDSTART:
            case E.RPL_ENDOFMOTD:
            case E.RPL_MOTD:
            case E.ERR_NOMOTD:
            case E.RPL_ADMINLOC1:
            case E.RPL_ADMINLOC2:
            case E.RPL_ADMINEMAIL:
            case E.RPL_USERHOST:
            case E.RPL_VERSION:
            case E.RPL_YOUREOPER:
            case E.RPL_SASLSUCCESS:
            case E.ERR_SASLFAIL:
            case E.ERR_SASLTOOLONG:
            case E.ERR_SASLABORTED:
            case E.ERR_SASLALREADY:
            case E.RPL_YOURHOST:
            case E.RPL_CREATED:
            case E.RPL_LUSERCLIENT:
            case E.RPL_LUSERME:
            case E.RPL_STATSCONN:
                this.addChannelMessage("console", "console", {
                    type: "rplmessage",
                    name: getEnum(bits[1]),
                    message: cData
                });
                break;
                
            case E.ERR_SASL_AUTH:
                addInfo({type: "error", name: getEnum(bits[1]), message: cData});
                cs.sendData(cID, "CAP END");
                cs.sendData(cID, "QUIT :sasl error");
                break;
                
            case E.RPL_SASL_AUTH:
                this.addChannelMessage("console", "console", {
                    type: "rplmessage",
                    name: getEnum(bits[1]),
                    message: cData
                });
                cs.sendData(cID, "CAP END");
                break;
                
            case E.RPL_LUSEROP:
            case E.RPL_LUSERUNKNOWN:
            case E.RPL_LUSERCHANNELS:
            case E.RPL_HOSTHIDDEN:
            case E.RPL_TRYAGAIN:
            case E.RPL_LOCALUSERS:
            case E.RPL_GLOBALUSERS:
            case E.RPL_ENDOFINVITELIST:
            case E.RPL_ENDOFEXCEPTLIST:
                this.addChannelMessage("console", "console", {
                    type: "rplmessage",
                    name: getEnum(bits[1]),
                    message: bits[3] + " " + cData
                });
                break;
                
                
            case E.ERR_SASLFAIL:
            case E.ERR_SASLTOOLONG:
            case E.ERR_SASLABORTED:
            case E.ERR_SASLALREADY:
            case E.ERR_NOTREGISTERED:
            case E.ERR_ALREADYREGISTERED:
            case E.ERR_PASSWDMISMATCH:
            case E.ERR_YOUREBANNEDCREEP:
            case E.ERR_NOPRIVILEGES:
            case E.ERR_CANTKILLSERVER:
            case E.ERR_NOOPERHOST:
            case E.ERR_UMODEUNKNOWNFLAG:
            case E.ERR_USERSDONTMATCH:
            case E.ERR_NICKLOCKED:
            case E.ERR_NONICKCHANGE:
                addInfo({type: "error", name: getEnum(bits[1]), message: cData});
                break;
            
            case E.ERR_NOSUCHNICK:
            case E.ERR_NOSUCHSERVER:
            case E.ERR_NOSUCHCHANNEL:
            case E.ERR_CANNOTSENDTOCHAN:
            case E.ERR_TOOMANYCHANNELS:
            case E.ERR_UNKNOWNCOMMAND:
            case E.ERR_ERRONEUSNICKNAME:
            case E.ERR_NOTONCHANNEL:
            case E.ERR_NEEDMOREPARAMS:
            case E.ERR_CHANNELISFULL:
            case E.ERR_INVITEONLYCHAN:
            case E.ERR_BANNEDFROMCHAN:
            case E.ERR_BADCHANNELKEY:
            case E.ERR_NOPRIVS:
            case E.RPL_SASLMECHS:
            case E.ERR_CHANOPRIVSNEEDED:
                addInfo({type: "error", name: getEnum(bits[1]), message: bits[3] + " " + cData});
                break;
            
            case E.RPL_UMODEGMSG:
                addInfo({type: "info", name: getEnum(bits[1]), message: bits[3] + " " + cData + " - Use /accept " + bits[3] + " to allow PMs from this user."});
                break;
            
            case E.ERR_NICKNAMEINUSE:
                addInfo({type: "error", name: getEnum(bits[1]), message: bits[3] + " " + cData});
                if(!this.connected){
                    this.nick = this.nick + "_"
                    cs.sendData(cID, "NICK " + this.nick);
                }
                break;
            
            case E.RPL_QLIST:
                addInfo({type: "quietlist", channel: bits[3], ban: bits[5], banner: bits[6], time: bits[7]});
                break;
                
            case E.RPL_ENDOFQLIST:
                addInfo({type: "info", message: bits[3] + " End of Quiet list"});
                break;
                
            case E.RPL_BANLIST:
                addInfo({type: "banlist", channel: bits[3], ban: bits[4], banner: bits[5], time: bits[6]});
                break;

            case E.RPL_ENDOFBANLIST:
                addInfo({type: "info", message: bits[3] + " End of Banlist"});
                break;
            
            
            case E.RPL_WHOREPLY:
                //this.pollState = 0;
                //:tin.libera.chat 352 duckgoose # ~matt user/duckgoose tin.libera.chat duckgoose H :0 Matt <matt@haxed.net>"
                if(bits[8].indexOf("G") > -1){
                    this.setIdleMessage(bits[7], "Away", bits[7] + "!" + bits[4] + "@" + bits[5]);
                }else{
                    this.setIdleMessage(bits[7], "", bits[7] + "!" + bits[4] + "@" + bits[5]);
                }
                break;
            
            case E.RPL_ENDOFWHO:
                this.pollState = 0;
                if(bits[3].toLowerCase() == GUI.current.name.toLowerCase()){
                    GUI.updateChannelNames(GUI.current.cID,GUI.current.type,GUI.current.name);
                }
                //a[":1 :zirconium.libera.chat 315 duckgoose ##chat :End of /WHO list."]
                break;
                
            

            case E.RPL_WHOISUSER:
                addInfo({type: "whois", name: bits[3], message: bits[3] + "!" + bits[4] + "@" + bits[5]});
                break;
                
            case E.RPL_WHOISCHANNELS:
                addInfo({type: "whois", name: bits[3], message: "is on " + cData});
                break;
                
            case E.RPL_WHOISSERVER:
                addInfo({type: "whois", name: bits[3], message: "is connected to " + bits[4] + " (" + cData + ")"});
                break;
            
                
            case E.RPL_WHOISSECURE:
                addInfo({type: "whois", name: bits[3], message: "is using a secure connection"});
                break;            
                
            case E.RPL_ENDOFWHOIS:
                addInfo({type: "whois", name: bits[3], message: "End of WHOIS"});
                break;        
                
            case E.RPL_WHOISACCOUNT:
                addInfo({type: "whois", name: bits[3], message: "is logged in as " + bits[4]});
                break;
                
            case E.RPL_WHOISIDLE:
                addInfo({type: "whois", name: bits[3], message: "has been idle for " + (new Date(parseInt(bits[4]) * 1000).toISOString().substr(11, 8))});
                
                addInfo({type: "whois", name: bits[3], message: "signed on " + (new Date(parseInt(bits[5]) * 1000).toGMTString())});
                break;

                
            
            case E.RPL_ISUPPORT:
                let isp = packet.substr(bits[0].length + bits[1].length + bits[2].length + 3);
                isp = isp.split(" :")[0].split(" ");
                for(let i in isp){
                    let vals = isp[i].split("=");
                    if(vals[1] == undefined) vals[1] = "";
                    this.iSupport[vals[0]] = vals[1];
                }
                this.raiseEvent("isupport", {sender: this});
                this.addChannelMessage("console", "console", {
                    type: "rplmessage",
                    name: "RPL_ISUPPORT",
                    message: isp.join(" ")
                });
                break;
            
            case E.RPL_NAMREPLY:
                this.cache += cData + " ";
                break;
                
            case E.RPL_ENDOFNAMES:
                let nicks = this.cache.slice(0, -1).split(" ");
                channel = this.getChannel("channel", bits[3]);
                for(let i in nicks){
                    let ni = this.userFlags(nicks[i].split("!")[0]);
                    let mask = ni.nick + "!" + (nicks[i].split("!")[1] || "null@null");
                    channel.users.push([ni.nick, ni.flags]);
                    this.addServerUser(ni.nick, mask);
                }
                this.sortsChannelUsers(bits[3]);
                break;  
                
            case E.RPL_TOPIC:
                channel = this.getChannel("channel", bits[3]);
                channel.topic.text = cData;
                this.addChannelMessage("channel", bits[3], {type: "info", message: "Topic for \"" + bits[3] + "\" is: " + cData});
                break;  
                
            case E.RPL_TOPICWHOTIME:
                channel = this.getChannel("channel", bits[3]);
                channel.topic.user = bits[4];
                channel.topic.date = bits[5];
                const band = new Date(parseInt(bits[5] + "000"));
                user = formatUser(bits[4]);
                this.addChannelMessage("channel", bits[3], {type: "info", message: "Topic set by " + user.nick + " on " + band.toDateString()});
                break;
                
                
                
            case "MODE":
                processMode();
                break; 
                
            case "NOTICE":
                //a[":1 :duckgoose!~matt@user/duckgoose NOTICE duckgoose :lol"]
                user = formatUser(bits[0]);
                if(ignoreList.test(user.mask)) return;
                addInfo({type: "notice", nick: user.nick, to: bits[2], message: cData.replace(/\x01/g, "")});
                playSound(settings.sounds.notice);
                break; 
            
            case "QUIT":
                user = formatUser(bits[0]);
                this.quitUser(user.nick, user.mask, cData);
                break;
                
            case "NICK":
                user = formatUser(bits[0]);
                chanSettings = getChannelSettings(this.guid, bits[2]);
                this.nickChange(user.nick, cData);
                this.raiseEvent("nickchange", {sender: this});
                break;
                
            case "KICK":
                user = formatUser(bits[0]);
                chanSettings = getChannelSettings(this.guid, bits[2]);
                
                this.kickUser(user.nick, bits[2], bits[3], cData);
                if(chanSettings.auto_rejoin){
                    if(bits[3].toLowerCase() == this.nick.toLowerCase()){
                        setTimeout(function(){
                            cs.sendData(cID, "JOIN " + bits[2]);
                        },2000);
                    }
                }
                break;
                
            case "PRIVMSG":
                let highlight = false;
                
                for(let i in settings.highlights){
                    if(settings.highlights[i] == "%n"){
                        if(cData.toLowerCase().indexOf(this.nick.toLowerCase()) > -1) highlight = true;
                    }else{
                        if(cData.toLowerCase().indexOf(settings.highlights[i].toLowerCase()) > -1) highlight = true;
                    }
                }
                
                user = formatUser(bits[0]);
                
                if( bits[2].match(/^(\@|\+|\!|\~)/) != null ){
                    cData = "[\x1D" + bits[2] + "\x1D] " + cData;
                    bits[2] = bits[2].replace(/^(\@|\+|\!|\~)/g, "");
                }
                
                if(ignoreList.test(user.mask)) return;
                
                
                if(isChannel(bits[2])){
                    if(cData.length > 7 && cData.substr(0,7).toUpperCase() == String.fromCharCode(1) + "ACTION"){
                        const aMsg = cData.substr(8).replace(/\x01/g, "");
                        this.addChannelMessage("channel", bits[2], {
                            type: "useraction",
                            nick: user.nick,
                            mask: user.mask,
                            message: aMsg,
                            highlight: highlight
                        });
                    }else if(cData.length > 2 && cData.substr(0,1) == String.fromCharCode(1)){
                        /* ctcp other than ACTION is handled here */
                        parseCTCP();
                    }else{
                        this.addChannelMessage("channel", bits[2], {
                            type: "usermessage",
                            nick: user.nick,
                            mask: user.mask,
                            message: cData,
                            highlight: highlight
                        });
                    }
                }else{
                    channel = this.getChannel("pm", user.nick);
                    if(channel == false) this.addChannel("pm", user.nick);
                    console.log("is a PM");
                    if(cData.length > 7 && cData.substr(0,7).toUpperCase() == String.fromCharCode(1) + "ACTION"){
                        const aMsg = cData.substr(8).replace(/\x01/g, "");
                        this.addChannelMessage("pm", user.nick, {
                            type: "useraction",
                            nick: user.nick,
                            mask: user.mask,
                            message: aMsg,
                            highlight: highlight
                        });
                    }else if(cData.length > 2 && cData.substr(0,1) == String.fromCharCode(1)){
                        /* ctcp other than ACTION is handled here */
                        parseCTCP();
                    }else{
                        console.log("pm added");
                        this.addChannelMessage("pm", user.nick, {
                            type: "usermessage",
                            nick: user.nick,
                            mask: user.mask,
                            message: cData,
                            highlight: highlight
                        });
                    }
                }
                break;
            
            case "PING":
                cs.sendData(cID, "PONG :" + cData);
                break;
                
            case "AWAY":
                user = formatUser(bits[0]);
                if(bits.length == 2 || cData == ""){
                    this.setIdleMessage(user.nick, "", user.mask);
                }else{
                    this.setIdleMessage(user.nick, cData, user.mask);
                }
                this.raiseEvent("away", {user: user.nick, message: (bits.length == 2 ? "" : cData)});
                break;
                
            case "JOIN":
                this.cache = "";
                user = formatUser(bits[0]);
                if(user.nick.toLowerCase() == this.nick.toLowerCase()){
                    this.addChannel("channel", bits[2]);
                    this.addChannelMessage("channel", bits[2], {type: "info", message: "Now talking on \"" + bits[2] + "\""});
                    if(!this.whoPollChannels.includes(bits[2].toLowerCase())) this.whoPollChannels.push(bits[2].toLowerCase());
                }else{
                    this.joinUser("channel", bits[2], user.nick, user.mask);
                }
                break;
                
            case "PART":
                user = formatUser(bits[0]);
                chanSettings = getChannelSettings(this.guid, bits[2]);
                
                if(user.nick.toLowerCase() == this.nick.toLowerCase()){
                    
                }else{
                    this.partUser("channel", bits[2], user.nick, user.mask, cData);
                }
                break;
                
            case "INVITE":
                user = formatUser(bits[0]);
                banners.add({
                    message: user.nick + " has invited you to join the channel " + cData,
                    buttons:["JOIN", "DECLINE"], 
                    cid: self.connectionID,
                    channel: cData,
                    net: self,
                    
                callback: function(e,x){
                    if(e == "JOIN"){
                        x.net.sendData("JOIN " + x.channel);
                    }
                }});
                break;
                
                
            case "TOPIC":
                user = formatUser(bits[0]);
                channel = this.getChannel("channel", bits[2]);
                if(channel){
                    channel.topic.text = cData;
                    channel.topic.user = user.nick;
                    channel.topic.date = parseInt((Date.now() / 1000));
                    this.raiseEvent("topicChange", {user: user.nick, date: parseInt((Date.now() / 1000)), topic: cData, cID: self.connectionID, channel: bits[2]});
                    this.addChannelMessage("channel", bits[2], {type: "info", message: user.nick + " has changed the topic to \"" + cData + "\""});
                }
                
                break;
            

            
            case "CAP":
                const caps = cData.split(" ");
                if(ubits[3] == "LS"){
                    let capRequest = "";
                    for(let i in caps){
                        if(this.caps.includes(caps[i].toUpperCase())) capRequest += " " + caps[i];
                    }
                    if(this.userInfo.auth.type == "sasl plain") capRequest += " sasl";
                    cs.sendData(cID, "CAP REQ :" + capRequest.substr(1));
                }else if(ubits[3] == "ACK"){
                    const chr0 = String.fromCharCode(0);
                    if(this.userInfo.auth.type == "sasl plain"){
                        cs.sendData(cID, "AUTHENTICATE PLAIN");
                        
                    }else{
                        cs.sendData(cID, "CAP END");
                    }
                }else if(ubits[3] == "NEW"){
                    let capRequest = "";
                    for(let i in caps){
                        if(this.caps.includes(caps[i].toUpperCase())) capRequest += " " + caps[i];
                    }
                    cs.sendData(cID, "CAP REQ :" + capRequest.substr(1));
                }
                break;
            
        }
        //end of data parse
        
        function parseCTCP(){
            user = formatUser(bits[0]);
            const ctcpParts = cData.replace(/\x01/g, "").split(" ");
            addInfo({type: "ctcp", user: user.nick, message: ctcpParts[0].toUpperCase()});
            switch(ctcpParts[0].toUpperCase()){
                case "VERSION":
                    cs.sendData(cID, "NOTICE " + user.nick + " :\x01VERSION BurdIRC " + version + " http://burdirc.haxed.net\x01");
                    //cs.sendData(cID, "AUTHENTICATE PLAIN");
                    break;
                    
                case "PING":
                    if(ctcpParts.length > 1){
                        cs.sendData(cID, "NOTICE " + user.nick + " :\x01PING " + ctcpParts[1] + "\x01");
                    }
                    break; 
                    
                case "TIME":

                        cs.sendData(cID, "NOTICE " + user.nick + " :\x01TIME " + (new Date().toLocaleString()) + "\x01");
                    
                    
                    break;
                    
                case "SOURCE":
             
                        cs.sendData(cID, "NOTICE " + user.nick + " :\x01SOURCE https://github.com/BurdIRC/Burd-IRC-LTS\x01");
                    
                    break;

            }
        }

        
    }
    
    
}




function strToColor(str) {
    if(!settings.showNickColors) return "#d6d6d6";
    let hash = 0;
    str = str + str + str + str;
    for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = hash.toString().replace(/\-/g, "");
    
    //0123456789ABC0123456789ABC0123456789ABC
    let cColor = "";
    for(let i in hash){
      cColor += userColors[hash[i]];
    }
    return ("#" + cColor.substr(0,6));
}

function getNetwork(cID){
    for(let i in networks){
        if(networks[i].connectionID == cID) return networks[i];
    }
    return false;
}

/*
setTimeout(function(){


    GUI.createNetwork({
    connectionID: 1,
    
    server: {
        address: "192.168.1.141",
        port: 8080,
        TLS: false,
        cert: "",
        password: "duckgoose/libera:061387*"
    },
    
    userInfo: {
        nick: "duckgoose",
        ident: "duckgoose",
        name: "Matt",
        auth: {
            type: "none",
            username: "",
            password: ""
        }
    }
}); },1000);
*/
















/*
const irc = new IRC({
    connectionID: 1,
    
    server: {
        address: "192.168.1.141",
        port: 8080,
        TLS: false,
        cert: "",
        password: "duckgoose/freenode:061387*"
    },
    
    userInfo: {
        nick: "duckgoose",
        ident: "duckgoose",
        name: "Matt",
        auth: {
            type: "none",
            username: "",
            password: ""
        }
    }
});

irc.on("created", (e)=>{
    this.log(e);
});





setTimeout(function(){ irc.connect(); },1000);
*/


