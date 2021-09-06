
let messageUpdateTimer = 0;
let messageCounter = 0;

const GUI = {

    current: {cID: 0, type: "", name: "none"},
    
    createNetwork: (e)=>{
        let temp = $("template#nav-network").html();
        temp = temp.replace("_netname_", e.server.address);
        temp = temp.replace(/_cid_/g, e.connectionID);
        $("div#nav-pane").append(temp);
        
        
        
        this.cID = e.connectionID;
        
        const irc = new IRC(e);
        
        irc.on("created", (e)=>{
            irc.connect();
        });

        irc.on("message", (e)=>{
            if(e.cID == GUI.current.cID && e.type == GUI.current.type && e.name.toLowerCase() == GUI.current.name){
                GUI.updateChannelMessages(e.cID, e.type, e.name);
            }
            if(e.message){
                
                if(e.message.highlight){
                    playSound(settings.sounds.highlight);
                }

                if(e.type == "pm"){
                    /* check if we need to create a PM pane */
                    if($("div[type='pm'][name='" + hexEncode(e.name.toLowerCase()) + "']").length == 0){
                        let temp = $("template#nav-channel").html();
                        temp = temp.replace(/_cid_/g, e.sender.connectionID);
                        temp = temp.replace(/_type_/g, "pm");
                        temp = temp.replace(/_name_/g, e.name);
                        temp = temp.replace(/_ename_/g, hexEncode(e.name.toLowerCase()));
                        $("div.network[cid='" + e.sender.connectionID + "'] div.pms").append(temp);
                    }
                }
                
                if(e.message.type == "usermessage" || e.message.type == "useraction"){
                    if(e.cID == GUI.current.cID && e.name.toLowerCase() == GUI.current.name.toLowerCase()) return;
                    let read = parseInt($("div[name='" + hexEncode(e.name.toLowerCase()) + "'][cid='" + e.cID + "'] div.item-count").text());
                    if(read == 99) return;
                    if(settings.showUnread) read++;
                    
                    if(e.message.highlight) $("div[name='" + hexEncode(e.name.toLowerCase()) + "'][cid='" + e.cID + "']").addClass("bell");
                    
                    $("div[name='" + hexEncode(e.name.toLowerCase()) + "'][cid='" + e.cID + "'] div.item-count").attr("num", read).text(read);
                }
            }
        });
        
        irc.on("join", (e)=>{
            if(e.cID == GUI.current.cID && e.type == GUI.current.type && e.name.toLowerCase() == GUI.current.name){
                GUI.updateChannelNames(e.cID, e.type, e.name);
            }
        });
        
        irc.on("quit", (e)=>{
            if($("div#users div.user[nick='" + hexEncode(e.nick.toLowerCase()) + "']").length > 0){
                $("div#users div.user[nick='" + hexEncode(e.nick.toLowerCase()) + "']").remove();
            }
            //GUI.updateChannelNames(GUI.current.cID, GUI.current.type, GUI.current.name);
        });
        
        irc.on("part", (e)=>{
            if(e.cID == GUI.current.cID && e.type == GUI.current.type && e.name.toLowerCase() == GUI.current.name){
                GUI.updateChannelNames(e.cID, e.type, e.name);
            }
        });
        
        irc.on("joined", (e)=>{
            if($("div[type='channel'][cid='" + e.sender.connectionID + "'][name='" + hexEncode(e.name.toLowerCase()) + "']").length == 0){
                let temp = $("template#nav-channel").html();
                temp = temp.replace(/_cid_/g, e.sender.connectionID);
                temp = temp.replace(/_type_/g, "channel");
                temp = temp.replace(/_name_/g, e.name);
                temp = temp.replace(/_ename_/g, hexEncode(e.name.toLowerCase()));
                $("div.network[cid='" + e.sender.connectionID + "'] div.channels").append(temp);
            }
        });
        
        irc.on("isupport", (e)=>{
            if(e.sender.iSupport.NETWORK != undefined){
                $("div.network[cid='" + e.sender.connectionID + "'] span.netname").text(e.sender.iSupport.NETWORK);
            }
        });
        
        $("div.network[cid='" + e.connectionID + "'] div.net-title").click();
        
    },
    
    closeChannel: (cID, type, name)=>{
        const net = getNetwork(cID);
        net.sendData("PART " + name + " :bye");
        $("div.nav-item[cid='" + cID + "'][name='" + hexEncode(name.toLowerCase()) + "']").remove();
        if($("div.selected-item").length == 0){
            $("div.network[cid='" + cID + "'] div.nav-item:last").click();
        }
    },
    
    updateChannelMessages: (cID, type, name)=>{
        /*
        clearTimeout(messageUpdateTimer);
        if(messageCounter > 4){
            GUI.updateChannelMessagesX(cID, type, name);
        }else{
            setTimeout(()=>{
                GUI.updateChannelMessagesX(cID, type, name);
            },100);
        }
        messageCounter++;
        */
        GUI.updateChannelMessagesX(cID, type, name);
    },
    
    updateChannelMessagesX: (cID, type, name)=>{
        messageCounter = 0;
        const net = getNetwork(cID);
        const marr = [];
        let htm = "";
        let fullChatHtml = "";
        let d = new Date();
        let lastType = "";
        
        
        for(let i in net.channels){
            if(net.channels[i].type == type && net.channels[i].name.toLowerCase() == name.toLowerCase()){
                const rv = net.channels[i].messages.slice().reverse();
                for(let j in rv){
                    const cmsg = rv[j];
                    const hNick = "<b>" + removeHTML(cmsg.nick) + "</b>";
                    switch(cmsg.type){
                        case "whois":
                       htm = $("template#whois").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", "[<b>" + cmsg.name + "</b>] " + linkify(removeHTML(cmsg.message)));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "");
                            
                            marr.push(htm);
                            break;
                        
                        case "usermessage":
                            htm = $("template#chat-msg").html();
                            d = new Date(cmsg.date);
                            if(onlyEmojis(cmsg.message)) htm = htm.replace("_emojic_", "emojimessage");
                            if(hasEmojis(cmsg.message)) htm = htm.replace("_emojic_", "hasemoji");
                            htm = htm.replace("_ename_", hexEncode(cmsg.nick));
                            htm = htm.replace("_name_", removeHTML(cmsg.nick));
                            htm = htm.replace("_message_", emojify(linkify(colors.parse(removeHTML(cmsg.message)))));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_color_", strToColor(cmsg.nick));
                            if(cmsg.highlight) htm = htm.replace("_highlight_", "highlighted");
                            
                            marr.push(htm)
                            break;
                        case "useraction":
                            htm = $("template#action-message").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_ename_", hexEncode(cmsg.nick));
                            htm = htm.replace("_name_", removeHTML(cmsg.nick));
                            htm = htm.replace("_message_", linkify(colors.parse(removeHTML(cmsg.message))));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            if(cmsg.highlight) htm = htm.replace("_highlight_", "highlighted");
                            
                            marr.push(htm)
                            break;
                        case "userpart":
                            htm = $("template#general-info").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", lang.has_left.replace("%n", hNick).replace("%m", removeHTML(cmsg.message)));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "info-out");
                            
                            marr.push(htm)
                            break;
                        case "userjoin":
                            htm = $("template#general-info").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", lang.has_joined.replace("%n", hNick));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "");
                            
                            marr.push(htm)
                            break;
                        case "userquit":
                            htm = $("template#general-info").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", lang.has_quit.replace("%n", hNick).replace("%m", removeHTML(cmsg.message)));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "info-out");
                            
                            marr.push(htm);
                            break;
                        case "nickchange":
                            htm = $("template#general-info").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", lang.name_change.replace("%o", hNick).replace("%n", "<b>" + removeHTML(cmsg.newNick) + "</b>"));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "");
                            setTimeout(function(){
                                $("div#my-nick").text(net.nick);
                            },100);
                            
                            marr.push(htm);
                            break;
                        case "userkicked":
                            htm = $("template#general-info").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", lang.kicked.replace("%n", "<b>" + removeHTML(cmsg.kicked) + "</b>").replace("%k", "<b>" + removeHTML(cmsg.kicker) + "</b>").replace("%m", "<b>" + removeHTML(cmsg.message) + "</b>"));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "");
                            
                            marr.push(htm);
                            break;
                        case "info":
                            htm = $("template#general-info").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", linkify(removeHTML(cmsg.message)));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "");
                            
                            marr.push(htm);
                            break;
                        case "error":
                            htm = $("template#chat-msg").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_name_", "ERROR");
                            htm = htm.replace("_message_", "[<b>" + cmsg.name + "</b>] " + linkify(colors.parse(removeHTML(cmsg.message))));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            
                            marr.push(htm);
                            break;
                        case "infoout":
                            htm = $("template#general-info").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", removeHTML(cmsg.message));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "info-out");
                            
                            marr.push(htm);
                            break;
                        case "rplmessage":
                            htm = $("template#chat-msg").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_name_", cmsg.name);
                            htm = htm.replace("_message_", linkify(colors.parse(removeHTML(cmsg.message))));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            marr.push(htm);
                            break;
                        case "chanmode":
                            htm = $("template#general-info").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_message_", lang.set_mode.replace("%n", "<b>" + removeHTML(cmsg.setter) + "</b>").replace("%m", "<b>" + removeHTML(cmsg.modes + " " + cmsg.args) + "</b>") );
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            htm = htm.replace("_classes_", "");
                            marr.push(htm);
                            break;
                        case "notice":
                            htm = $("template#chat-msg").html();
                            d = new Date(cmsg.date);
                            htm = htm.replace("_name_", "NOTICE");
                            htm = htm.replace("_message_", "[<b>" + removeHTML(cmsg.nick) + "</b> =&gt; <b>" + removeHTML(cmsg.to) + "</b>]  " + linkify(colors.parse(removeHTML(cmsg.message))));
                            htm = htm.replace("_date_", removeHTML(d.toLocaleTimeString()));
                            marr.push(htm);
                            break;
                    }
                    lastType = cmsg.type;
                    if(marr.length >= settings.maxHistory) break;
                }
            }
        }
        marr.reverse();
        const ca = $('#chat-area');
        if(["chanmode", "nickchange", "userkicked", "userquit", "userpart"].includes(lastType)){
            GUI.updateChannelNames(cID, type, name);
        }
        ca.html(marr.join(""));
        ca.scrollTop(ca.prop("scrollHeight"));

    },
    
    updateChannelNames: (cID, type, name)=>{
        const net = getNetwork(cID);
        
        if(cID != GUI.current.cID && GUI.current.type != type && GUI.current.name.toLowerCase() != name.toLowerCase()) return;

        if(net){
            for(let i in net.channels){
                if(net.channels[i].type == type && net.channels[i].name.toLowerCase() == name.toLowerCase()){
                    if(net.channels[i].users){
                        $("div#channel-name").text(net.channels[i].name);
                        if(net.channels[i].topic){
                            $("div#channel-topic").html(linkify(colors.parse(removeHTML(net.channels[i].topic.text))));
                            $("div#channel-topic").attr("title", removeHTML(net.channels[i].topic.text));
                        }
                        const html = $("template#list-user").html();
                        let htm = html;
                        let newHTML = "";
                        for(let j in net.channels[i].users){
                            const nuser = net.getServerUser(net.channels[i].users[j][0]);
                            htm = html;
                            if(nuser.length > 0) htm = htm.replace("_state_", (nuser[2] == "" ? "" : "away"));
                            htm = htm.replace("_name_", removeHTML(net.channels[i].users[j][0]));
                            htm = htm.replace("_ename_", hexEncode(net.channels[i].users[j][0]));
                            htm = htm.replace("_flags_", removeHTML(net.channels[i].users[j][1]));
                            htm = htm.replace("_color_", (nuser[2] == "" ? strToColor(net.channels[i].users[j][0]) : "#6f6f6f"));
                            newHTML += htm;
                            if(j > 299) break;
                        }
                        $("div#userlist").html(newHTML);
                        if(net.channels[i].users.length > 299) $("div#userlist").append("<div style=\"padding:5px;text-align:center;\"><a href=\"userlist://full\">View entire list...</a></div>");
                        
                        

                        $("div#user-count").text(lang.users_here.replace("%c", net.channels[i].users.length));
                    }

                }
            }
        }
    },
    
    openQuery: (cID, name)=>{
        const net = getNetwork(cID);
        const chan = net.getChannel(cID, "pm", name);
        if(net){
            if($("div.network[cid='" + cID + "'] div.nav-item[name='" + hexEncode(name.toLowerCase()) + "']").length == 0){
                let temp = $("template#nav-channel").html();
                temp = temp.replace(/_cid_/g, cID);
                temp = temp.replace(/_type_/g, "pm");
                temp = temp.replace(/_name_/g, removeHTML(name));
                temp = temp.replace(/_ename_/g, hexEncode(name.toLowerCase()));
                $("div.network[cid='" + cID + "'] div.pms").append(temp);
            }
        }
        
        $("div.network[cid='" + cID + "'] div.nav-item[name='" + hexEncode(name.toLowerCase()) + "']").click();
    },
    
    removeChannel: (cID, name)=>{
        const net = getNetwork(cID);
        const navItem = $("div[name='" + hexEncode(name.toLowerCase()) + "'][cid='" + cID + "']");
        if(navItem.length > 0){
            getNetwork(cID).sendData("PART " + name);
            if(navItem.hasClass("selected-item")){
                if(navItem.prev().length > 0){
                    navItem.prev().click();
                    navItem.remove();
                }else if(navItem.next().length > 0){
                    navItem.next().click();
                    navItem.remove();
                }else{
                    $("div[type='console']:first").click();
                    navItem.remove();
                }
            }
        }
        for(let i in net.channels){
            if(net.channels[i].name.toLowerCase() == name.toLowerCase()){
                net.channels.splice(i, 1);
            }
        }
    },
    
    removePM: (cID, name)=>{
        console.log(cID);
        console.log(name);
        const navItem = $("div[name='" + hexEncode(name.toLowerCase()) + "'][cid='" + cID + "']");
        if(navItem.length > 0){
            if(navItem.hasClass("selected-item")){
                if(navItem.prev().length > 0){
                    navItem.prev().click();
                    navItem.remove();
                }else if(navItem.next().length > 0){
                    navItem.next().click();
                    navItem.remove();
                }else{
                    $("div[type='console']:first").click();
                    navItem.remove();
                }
            }else{
                navItem.remove();
            }
        }
    },
    
    removeNetwork: (cID)=>{
        networks[cID].server.reconnect = false;
        networks[cID].sendData("QUIT :burdirc.haxed.net");
        $("div.network[cid='" + cID + "']").remove();
    },
    
    showChannel: (cID, type, name)=>{
        const net = getNetwork(cID);
        GUI.current.cID = cID;
        GUI.current.name = name.toLowerCase();
        GUI.current.type = type;
        
        $("div[name='" + hexEncode(name.toLowerCase()) + "'][cid='" + cID + "'] div.item-count").attr("num", 0).text("0");
        
        $("div#my-nick").text(net.nick);
        if(net){
            if(type == "channel"){
                $("div#chan").removeClass("no-userlist");
                GUI.updateChannelNames(cID, type, name);
                GUI.updateChannelMessages(cID, type, name);
            }else if(type == "pm"){
                $("div#chan").addClass("no-userlist");
                $("div#userlist").html("");
                $("div#channel-name").text($("div.network[cid='" + cID + "'] div.nav-item[name='" + hexEncode(name.toLowerCase()) + "'] div.item-name").text());
                $("div#channel-topic").text(networks[net.connectionID].iSupport.NETWORK);
                GUI.updateChannelMessages(cID, "pm", name);
            }else if(type == "console"){
                GUI.current.name = "console";
                $("div#chan").addClass("no-userlist");
                $("div#userlist").html("");
                $("div#channel-name").text("Network Console");
                $("div#channel-topic").text($("div.selected-item span.netname").text());
                GUI.updateChannelMessages(cID, "console", "console");
            }
        }
        $("input#input").focus();
        document.title = "Burd IRC " + version + " - " + name;
        const ca = $('#chat-area');
        ca.scrollTop(ca.prop("scrollHeight"));
    }
    
}