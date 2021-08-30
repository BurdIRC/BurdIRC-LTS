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
    const chanObj = net.getChannel(GUI.current.type, GUI.current.name);
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

    
    
    if(input.substr(0,1) == "/"){
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
                addInfoOut("MODE " + GUI.current.name + " " + tmpStr + " " + banners.join(" "), "*");
                net.sendData("MODE " + GUI.current.name + " " + tmpStr + " " + banners.join(" "));
                break;
                
            case "CLEAR":
                chanObj.messages = [];
                $("div#chat-area").html("");
                break;
                
            case "CLOSE":
                GUI.closeChannel(GUI.current.cID, GUI.current.type, GUI.current.name);
                break;
                
            case "CTCP":
                if(checkArgs(["string", "string"])) return;
                net.sendData("PRIVMSG " + bits[1] + " :" + ctcpChar + _input.substr(bits[1].length + 1) + ctcpChar);
                break;
                
            case "CYCLE":
                net.sendData("PART " + GUI.current.name);
                net.sendData("JOIN " + GUI.current.name);
                break;
                
            case "DEHOP":
            case "UNHOP":
                if(checkArgs(["string"])) return;
                banners = _input.trim().split(" ");
                tmpStr = "-";
                for (let i = 0; i < banners.length; i++) {
                    tmpStr += "h";
                }
                addInfoOut("MODE " + GUI.current.name + " " + tmpStr + " " + banners.join(" "), "*");
                net.sendData("MODE " + GUI.current.name + " " + tmpStr + " " + banners.join(" "));
                break;

            case "DEVOICE":
            case "UNVOICE":
                if(checkArgs(["string"])) return;
                banners = _input.trim().split(" ");
                tmpStr = "-";
                for (let i = 0; i < banners.length; i++) {
                    tmpStr += "v";
                }
                addInfoOut("MODE " + GUI.current.name + " " + tmpStr + " " + banners.join(" "), "*");
                net.sendData("MODE " + GUI.current.name + " " + tmpStr + " " + banners.join(" "));
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
                addInfoOut("MODE " + GUI.current.name + " " + tmpStr + " " + banners.join(" "), "*");
                net.sendData("MODE " + GUI.current.name + " " + tmpStr + " " + banners.join(" "));
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
                        addInfo(bits[1] + " added to ignore list", "*");
                    }else{
                        addInfo(bits[1] + " is already ignored", "*");
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
                    net.sendData("KICK " + GUI.current.name + " " + bits[1]);
                }else{
                    net.sendData("KICK " + GUI.current.name + " " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                }
                addInfoOut("KICK " + bits[1], "*");
                break;
                
            case "KICKBAN":
            case "BANKICK":
                if(checkArgs(["string"])) return;
                tmpStr = getMask(bits[1]);
                if(bits.length == 2){
                    net.sendData("MODE " + GUI.current.name + " +b " + tmpStr);
                    net.sendData("KICK " + GUI.current.name + " " + bits[1]);
                }else{
                    net.sendData("MODE " + GUI.current.name + " +b " + tmpStr);
                    net.sendData("KICK " + GUI.current.name + " " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                }
                addInfoOut("KICKBAN " + bits[1], "*");
                break;
                
            case "LIST":
                addInfo("This command will be added soon", "*");
                break;  
                
            case "ME":
            case "ACTION":
                if(checkArgs(["string"])) return;
                net.sendData("PRIVMSG " + GUI.current.name + " :" + ctcpChar + "ACTION " + _input + ctcpChar);
                net.addChannelMessage(typ, chan, {
                    type: "useraction",
                    nick: net.nick,
                    mask: net.nick + "!~@~",
                    message: _input
                });
                break;
                
            case "MODE":
                if(bits.length == 1){
                    net.sendData("MODE " + GUI.current.name);
                }else{
                    if(bits[1][0] == "+" || bits[1][0] == "-"){
                        net.sendData("MODE " + GUI.current.name + " " + _input);
                    }else{
                        net.sendData("MODE " + _input);
                    }
                }
                addInfoOut("MODE " + _input, "*");
                break;
                
                
            case "MSG":
                if(checkArgs(["string", "string"])) return;
                net.sendData("PRIVMSG " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                addInfoOut("MSG " + _input, "*");
                break;
                
                
            case "NAMES":
                if(bits.length == 1){
                    net.sendData("NAMES " + GUI.current.name);
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
                net.sendData("MODE " + GUI.current.name + " +o " + bits[1]);
                addInfoOut("OP " + _input, "*");
                break;
                
            case "PART":
            case "LEAVE":
                if(bits.length == 1){
                    net.sendData("PART " + GUI.current.name);
                }else{
                    if(bits[1][0] == "#"){
                        if(bits.length == 2){
                            net.sendData("PART " + bits[1]);
                        }else{
                            net.sendData("PART " + bits[1] + " :" + _input.substr(bits[1].length + 1));
                        }
                    }else{
                        net.sendData("PART " + GUI.current.name + " :" + _input.substr(bits[1].length + 1));
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
                net.sendData("MODE " + GUI.current.name + " +q " + bits[1]);
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
                net.sendData("TOPIC " + GUI.current.name + " :" + _input);
                addInfoOut("TOPIC " + bits[1], "*");
                break;
                
            case "UNBAN":
                if(checkArgs(["string"])) return;
                net.sendData("MODE " + GUI.current.name + " -b " + _input);
                addInfoOut("UNBAN " + bits[1], "*");
                break;
                
            case "UNQUIET":
                if(checkArgs(["string"])) return;
                net.sendData("MODE " + GUI.current.name + " -q " + _input);
                addInfoOut("UNQUIET " + bits[1], "*");
                break;
                
                
            case "USERHOST":
                if(checkArgs(["string"])) return;
                tmpStr = getMask(bits[1]);
                addInfo(tmpStr, "*");
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
                    addInfo(bits[1] + " removed from ignore list", "*");
                }else{
                    addInfo(bits[1] + " was not found on ignore list", "*");
                }
                
                break;
                
            default:
                //addInfo(lang.invalid_command.replace("%c", command.toUpperCase()), "*");
                //net.raiseEvent("message", {sender: net, cID: id, type: typ, name: chan});
                
                if(!userCommands(input, cID, type, channel)) net.sendData(input.substr(1));
                break;
        }
    }else{
        /* send message */
        net.sendData("PRIVMSG " + GUI.current.name + " :" + input);
        net.addChannelMessage(GUI.current.type, GUI.current.name, {
            type: "usermessage",
            nick: net.nick,
            mask: net.nick + "!~@~",
            message: input
        });
    }
    

}