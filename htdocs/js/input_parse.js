const inputHistory = {
    items: [],
    index: 0
};

$(function(){
    $("input#input").on("keypress", function(e){
        if(e.keyCode == 13) parseInput($(this).val());
    });
});

const parseInput = (input, cID, type, channel)=>{
    if(input.length < 1) return;
    messageCounter = 5;
    
    inputHistory.items.splice(0, 0, input);
    
    if(inputHistory.items.length > 100){
        inputHistory.items.splice(inputHistory.items.length - 1, 1);
    }
    
    $("input#input").val("");
    
    const id = (cID || GUI.current.cID);
    const typ = (type || GUI.current.type);
    const chan = (channel || GUI.current.name);
    
    const net = getNetwork(id);
    
    const inputL = input.toLowerCase();
    const inputU = input.toUpperCase();
    const bits = input.split(" ");
    const ubits = input.toUpperCase().split(" ");
    const _input = input.substr(bits[0].length + 1);
    const command = bits[0].substr(1);
    const chanObj = net.getChannel(typ, chan);
    const ctcpChar = String.fromCharCode(1);
    
    
    let tmpStr = "";
    let tmpArr = [];
    let banners = [];
    

    
    const addInfo = function(text, win){
        if(win == "console"){
            net.addChannelMessage("console", "console", {
                type: "info",
                message: text
            });
        }else{
            net.addChannelMessage(typ, chan, {
                type: "info",
                message: text
            });
        }
    }
    
    const addInfoOut = function(text, win){
        if(win == "console"){
            net.addChannelMessage("console", "console", {
                type: "infoout",
                message: text
            });
        }else{
            net.addChannelMessage(typ, chan, {
                type: "infoout",
                message: text
            });
        }
    }

    const checkArgs = function(e){
        if(bits.length < e.length + 1){
            addInfo(lang.invalid_args.replace("%c", command.toUpperCase()), "*");
            net.raiseEvent("message", {sender: net, cID: id, type: typ, name: chan});
            return true;
        }
        return false;
    }


    const getMask = function(nick){
        const info = net.getServerUser(bits[1]);
        if(info.length == 0) return nick + "!*@*";
        return "*!" + info[1].split("!")[1];
    }

    
    if(input.substr(0,2) == "//"){
        if(input.match(/nickserv/ig)!=null) return addInfo("Your message was not sent for security reasons. (Nickserv was detected in a // message)", "*");
        net.sendData("PRIVMSG " + chan + " :" + input.substr(1));
        net.addChannelMessage(typ, chan, {
            type: "usermessage",
            nick: net.nick,
            mask: net.nick + "!~@~",
            message: input.substr(1)
        });
    }else if(input.substr(0,1) == "/"){
        switch(command.toUpperCase()){
            
            case "EVAL":
                eval(_input);
                break;
            
            
            case "ABOUT":
                 addInfo("Burd IRC " + version + " by Matthew Ryan (haxed.net)", "*");
                break;
            case "AWAY":
                //if(checkArgs(2)) return;
                if(bits.length == 1 || _input == ""){
                    addInfo(lang.back, "*");
                }else{
                    addInfo(lang.away.replace("%m", _input), "*");
                }
                break;
                
                
            case "BAN":
                if(checkArgs(["string"])) return;
                banners = _input.trim().split(" ");
                tmpStr = "+";
                for (let i = 0; i < banners.length; i++) {
                    tmpStr += "b";
                }
                addInfoOut("MODE " + chan + " " + tmpStr + " " + banners.join(" "), "*");
                net.sendData("MODE " + chan + " " + tmpStr + " " + banners.join(" "));
                break;
                
            case "CLEAR":
                chanObj.messages = [];
                $("div#chat-area").html("");
                break;
                
            case "CLOSE":
                GUI.closeChannel(id, typ, chan);
                break;
                
            case "CTCP":
                if(checkArgs(["string", "string"])) return;
                net.sendData("PRIVMSG " + bits[1] + " :" + ctcpChar + _input.substr(bits[1].length + 1) + ctcpChar);
                break;
                
            case "CYCLE":
                net.sendData("PART " + chan);
                net.sendData("JOIN " + chan);
                break;
                
            case "DEHOP":
            case "UNHOP":
                if(checkArgs(["string"])) return;
                banners = _input.trim().split(" ");
                tmpStr = "-";
                for (let i = 0; i < banners.length; i++) {
                    tmpStr += "h";
                }
                addInfoOut("MODE " + chan + " " + tmpStr + " " + banners.join(" "), "*");
                net.sendData("MODE " + chan + " " + tmpStr + " " + banners.join(" "));
                break;

            case "DEVOICE":
            case "UNVOICE":
                if(checkArgs(["string"])) return;
                banners = _input.trim().split(" ");
                tmpStr = "-";
                for (let i = 0; i < banners.length; i++) {
                    tmpStr += "v";
                }
                addInfoOut("MODE " + chan + " " + tmpStr + " " + banners.join(" "), "*");
                net.sendData("MODE " + chan + " " + tmpStr + " " + banners.join(" "));
                break;
               
            case "ECHO":
                if(checkArgs(["string"])) return;
                addInfo(_input, "*");
                break;
                
            case "GHOST":
                if(checkArgs(["string", "string"])) return;
                addInfoOut("GHOST " + bits[1], "*");
                net.sendData("PRIVMSG NICKSERV :GHOST " + _input);
                break;
                
            case "HOP":
                if(checkArgs(["string"])) return;
                banners = _input.trim().split(" ");
                tmpStr = "+";
                for (let i = 0; i < banners.length; i++) {
                    tmpStr += "h";
                }
                addInfoOut("MODE " + chan + " " + tmpStr + " " + banners.join(" "), "*");
                net.sendData("MODE " + chan + " " + tmpStr + " " + banners.join(" "));
                break;
                
                
            case "IGNORE":
                if(bits.length == 1){
                    addInfo("IGNORE LIST ITEMS: " + settings.ignoreList.length, "*");
                    for(let i in settings.ignoreList){
                        addInfo("ITEM " + i + ": " + settings.ignoreList[i], "*");
                    }
                }else{
                    if(bits[1].indexOf("!") == -1 && bits[1].indexOf("@") == -1) bits[1] = bits[1] + "!*@*";
                    if(ignoreList.add(bits[1])){
                        addInfo(lang.ignored.replace("%n", bits[1]), "*");
                    }else{
                        addInfo(lang.isignored.replace("%n", bits[1]), "*");
                    }
                }
                break;
                
            case "INVITE":
                if(checkArgs(["string", "string"])) return;
                net.sendData("INVITE " + _input);
                break;
                
                
            case "JOIN":
                if(checkArgs(["string"])) return;
                net.sendData("JOIN " + _input);
                break;
                
                
                
            case "KICK":
                if(checkArgs(["string"])) return;
                if(bits.length == 2){
                    net.sendData("KICK " + chan + " " + bits[1]);
                }else{
                    net.sendData("KICK " + chan + " " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                }
                addInfoOut("KICK " + bits[1], "*");
                break;
                
            case "KICKBAN":
            case "BANKICK":
                if(checkArgs(["string"])) return;
                tmpStr = getMask(bits[1]);
                if(bits.length == 2){
                    net.sendData("MODE " + chan + " +b " + tmpStr);
                    net.sendData("KICK " + chan + " " + bits[1]);
                }else{
                    net.sendData("MODE " + chan + " +b " + tmpStr);
                    net.sendData("KICK " + chan + " " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                }
                addInfoOut("KICKBAN " + bits[1], "*");
                break;
                
            case "LIST":
                addInfo("This command will be added soon", "*");
                break;  
                
            case "ME":
            case "ACTION":
                if(checkArgs(["string"])) return;
                net.sendData("PRIVMSG " + chan + " :" + ctcpChar + "ACTION " + _input + ctcpChar);
                net.addChannelMessage(typ, chan, {
                    type: "useraction",
                    nick: net.nick,
                    mask: net.nick + "!~@~",
                    message: _input
                });
                break;
                
            case "MODE":
            
                if(bits.length == 1){
                    net.sendData("MODE " + chan);
                }else{
                    if(bits[1].toLowerCase() == net.nick.toLowerCase()){
                        net.sendData("MODE " + _input);
                        addInfoOut("MODE " + _input, "*");
                    }else{
                        net.sendData("MODE " + chan + " " + _input);
                        addInfoOut("MODE " + chan + " " + _input, "*");
                    }
                }
                
                break;
                
                
            case "MSG":
                if(checkArgs(["string", "string"])) return;
                net.sendData("PRIVMSG " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                addInfoOut("MSG " + _input, "*");
                break;
                
                
            case "NAMES":
                if(bits.length == 1){
                    net.sendData("NAMES " + chan);
                }else{
                    net.sendData("NAMES " + bits[1]);
                }
                addInfoOut("NAMES " + _input, "*");
                break;
                
            case "NOTICE":
                if(checkArgs(["string", "string"])) return;
                net.sendData("NOTICE " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                addInfoOut("NOTICE " + _input, "*");
                break;
                
                
            case "OP":
                if(checkArgs(["string"])) return;
                net.sendData("MODE " + chan + " +o " + bits[1]);
                addInfoOut("OP " + _input, "*");
                break;
                
            case "PART":
            case "LEAVE":
                if(bits.length == 1){
                    net.sendData("PART " + chan);
                }else{
                    if(bits[1][0] == "#"){
                        if(bits.length == 2){
                            net.sendData("PART " + bits[1]);
                        }else{
                            net.sendData("PART " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                        }
                    }else{
                        net.sendData("PART " + chan + " :" + _input.substr(bits[1].length + 1));
                    }
                    
                }
                addInfoOut("PART " + _input, "*");
                break;
                
            case "QUERY":
            case "PM":
                if(checkArgs(["string"])) return;
                if(bits.length == 2){
                    GUI.openQuery(id, bits[1]);
                }else{
                    GUI.openQuery(id, bits[1]);
                    net.sendData("PRIVMSG " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                    net.addChannelMessage("pm", bits[1], {
                        type: "usermessage",
                        nick: net.nick,
                        mask: net.nick + "!~@~",
                        message: _input.substr(bits[1].length + 1)
                    });
                }
                break;
                
                
            case "QUIET":
                if(checkArgs(["string"])) return;
                net.sendData("MODE " + chan + " +q " + bits[1]);
                addInfoOut("QUIET " + bits[1], "*");
                break;
                
            case "QUOTE":
            case "RAW":
                if(checkArgs(["string"])) return;
                net.sendData(_input);
                break;
                
            case "QUIT":
                net.server.reconnect = false;
                net.sendData("QUIT " + _input);
                break;
                
            case "TOPIC":
                if(checkArgs(["string"])) return;
                net.sendData("TOPIC " + chan + " :" + _input);
                addInfoOut("TOPIC " + _input, "*");
                break;
                
            case "UNBAN":
                if(checkArgs(["string"])) return;
                net.sendData("MODE " + chan + " -b " + _input);
                addInfoOut("UNBAN " + bits[1], "*");
                break;
                
            case "UNQUIET":
                if(checkArgs(["string"])) return;
                net.sendData("MODE " + chan + " -q " + _input);
                addInfoOut("UNQUIET " + bits[1], "*");
                break;
                
                
            case "USERHOST":
                if(checkArgs(["string"])) return;
                tmpStr = getMask(bits[1]);
                addInfo(tmpStr, "*");
                break;
            
            case "POPUP":
                
                break;
                
            case "HELP":
                if(bits.length == 1){
                    const ccoms = [];
                    for(let i in lang.help){
                        ccoms.push(i);
                    }
                    const msp = lang.help_text.split("\r\n");
                    for(let i in msp){
                        addInfo(msp[i].replace("%c", ccoms.join(" ")), "*");
                    }
                }else{
                    if(lang.help[ubits[1]]){
                        addInfo(lang.help[ubits[1]], "*");
                    }else{
                        addInfo(lang.no_command.replace("%c", bits[1]), "*");
                    }
                }
                break;
                
            case "UNIGNORE":
                if(checkArgs(["string"])) return;

                if(bits[1].indexOf("!") == -1 && bits[1].indexOf("@") == -1) bits[1] = bits[1] + "!*@*";
                if(ignoreList.remove(bits[1])){
                    addInfo(lang.unignored.replace("%n", bits[1]), "*");
                }else{
                    addInfo(lang.notignored.replace("%n", bits[1]), "*");
                }
                
                break;
                
            default:
                //addInfo(lang.invalid_command.replace("%c", command.toUpperCase()), "*");
                //net.raiseEvent("message", {sender: net, cID: id, type: typ, name: chan});
                if(!userCommands(input, id, type, channel)) net.sendData(input.substr(1));
                break;
        }
    }else{
        /* send message */
        if(input.trim().match(/(^\/)(ns\s|nickserv|(.*)nickserv)/) != null) return addInfo("Your message was not sent for security reasons. (Nickserv slip was detected)", "*");
        net.sendData("PRIVMSG " + chan + " :" + input);
        net.addChannelMessage(typ, chan, {
            type: "usermessage",
            nick: net.nick,
            mask: net.nick + "!~@~",
            message: input
        });
    }
    

}