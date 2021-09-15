const channelMenu = function(e){
    const net = getNetwork(e.attr('cid'));
    const type = e.attr('type');
    if(type == "channel"){
        if(e.find("div.item-name").text() == "") return;
        menu.create([
            { title: e.find("div.item-name").text() },
            {
                text: lang.close,
                icon: "/images/close.svg",
                more: false,
                callback: function(mo){
                    GUI.removeChannel(e.attr('cid'), hexDecode(e.attr('name')));
                }
            },
            {
                text: lang.cycle,
                icon: "/images/refresh.svg",
                more: false,
                callback: function(mo){
                    getNetwork(e.attr('cid')).sendData("PART " + hexDecode(e.attr('name')));
                    getNetwork(e.attr('cid')).sendData("JOIN " + hexDecode(e.attr('name')));
                }
            },
            { text: "-" },
            {
                text: lang.channel_options,
                icon: "/images/tune.svg",
                more: false,
                callback: function(mo){
                    showMiniFrame("channel_settings.html?sid=" + networks[e.attr('cid')].guid + "&channel=" + e.attr('name'));
                }
            }
        ]);
    }else if(type == "pm"){
        if(e.find("div.item-name").text() == "") return;
        menu.create([
            { title: e.find("div.item-name").text() },
            {
                text: lang.close,
                icon: "/images/close.svg",
                more: false,
                callback: function(mo){
                    GUI.removePM(e.attr('cid'), hexDecode(e.attr('name')));
                }
            },
            {
                text: lang.ignore,
                icon: "/images/account-cancel.svg",
                more: false,
                callback: function(mo){
                    //GUI.removeChannel(e.attr('cid'), hexDecode(e.attr('name')));
                    const iu = hexDecode(e.attr('name')) + "!*@*";
                    if(ignoreList.add(iu)){
                        //added
                        net.addChannelMessage(GUI.current.type, GUI.current.name, {
                            type: "info",
                            message: lang.ignored.replace("%n", iu)
                        });
                    }else{
                        //already added
                        ignoreList.remove(iu);
                        net.addChannelMessage(GUI.current.type, GUI.current.name, {
                            type: "info",
                            message: lang.unignored.replace("%n", iu)
                        });
                    }
                    
                }
            }
        ]);
    }else{
        if(e.find("div.item-name").text() == "") return;
        menu.create([
            { title: e.find("span.netname").text() },
            {
                text: lang.close_network,
                icon: "/images/close.svg",
                more: false,
                callback: function(mo){
                    GUI.removeNetwork(e.attr('cid'));
                }
            }
        ]);
    }
}

$(()=>{
    
    $("div#menubar").on("mouseover", function(e) {
        if(!showNavPane) showNav();
        
    });
    $("div#chan").on("mouseover", function(e) {
        if(!showNavPane) hideNav();
    });
    $("div#app-settings").on("click", function(e) {
        showIframe("settings.html");
        
    });
    
    $("div#channel-topic").on("click", function(e) {
        menu.create([
            {
                text: lang.copy,
                icon: "/images/content-copy.svg",
                more: false,
                callback: function(mo){
                    copyToClipboard($("div#channel-topic").text());
                }
            },
            {
                text: lang.edit,
                icon: "/images/pencil.svg",
                more: false,
                callback: function(mo){
                    const topic = $("div#channel-topic").text();
                    $("input#input").val("/topic " + topic).focus();
                }
            }
        ]);
    });
    
    $("div#banners").on("click", "div.button", function(e) {
        const bid = $(this).parent().parent().attr("bid");
        banners.callbacks[bid][0]($(this).text(), banners.callbacks[bid][1]);
        delete(banners.callbacks[bid]);
        $(this).parent().parent().hide(100, function(){ $(this).remove(); });
    });
    
    $("div#nav-collapse").on("click", function(e) {
        if($("div#nav-collapse").hasClass("ison")){
            showNavPane = true;
            showNav();
            $("div#nav-collapse").removeClass("ison");
            $("div#nav-collapse").css("background-image", "url(images/white/arrow-collapse-left.svg)");
        }else{
            showNavPane = false;
            hideNav();
            $("div#nav-collapse").addClass("ison");
            $("div#nav-collapse").css("background-image", "url(images/white/arrow-expand-right.svg)");
        }
    });
    
    $("div#add-network").on("click", function(e) {
        showMiniFrame("networks.html");
    });
    
    $("div#users").on("contextmenu", function(e) {
        e.preventDefault();
    });
    
    $("div#upload").on("click", function(e) {
        $('#file').trigger('click');   
    });
    
    $("div#nav-pane").on("contextmenu", function(e) {
        const t = $(e.target);
        if(t.hasClass("nav-item")){
            channelMenu(t);
        }else{
            channelMenu(t.parents(".nav-item"));
        }
        e.preventDefault();
    });

    $("div#nav-pane").on("click", "div.nav-item", function(e){
        $("div#chan").show();
        
        const t = $(e.target);
        
        const type = ($(e.target).attr('type') || $(e.target).parent().attr('type'));
        
        $(this).removeClass("bell");

        if($(e.target).hasClass("item-menu") || e.button == 1){
            if(t.hasClass("nav-item")){
                channelMenu(t);
            }else{
                channelMenu(t.parents(".nav-item"));
            }
            return;
        }
        $("div.selected-item").removeClass("selected-item");
        $(this).addClass("selected-item");
        GUI.showChannel($(this).attr("cid"), $(this).attr("type"), hexDecode($(this).attr("name")));

        
    });
    /*
    $("div#nav-pane").on("click", "span.netname", function(e){
        GUI.showChannel($(this).parent().parent().attr("cid"), "console", "console");
    });
    */
    
    $("div#my-nick").on("click", (e)=>{
        $("input#input").val("/nick ").focus();
    });
    
    $("div#userlist").on("click", "div.user", function(e){
        const usr = removeHTML(hexDecode($(this).attr("nick")));
        userMenu($("div.selected-item").attr("cid"), usr);
    });
    $("div#userlist").on("contextmenu", "div.user", function(e){
        const usr = removeHTML(hexDecode($(this).attr("nick")));
        userMenu($("div.selected-item").attr("cid"), usr);
    });

    $("body").on("contextmenu", "div.messageuser", function(e){
        userMenu($("div.selected-item").attr("cid"), hexDecode($(this).parent().attr("nick")));
        e.preventDefault();
    });
    
    $("body").on("click", "div.messageuser", function(e){
        userMenu($("div.selected-item").attr("cid"), hexDecode($(this).parent().attr("nick")));
    });
    
    $("body").on("click", "div#user-count", function(e){
        menu.create([
            {
                text: lang.banlist,
                icon: "/images/format-list-bulleted.svg",
                more: false,
                callback: function(mo){
                    showMiniFrame("banlist.html");
                }
            }
        ]);
    });
    
    $("body").on("click", "a", function(e){
        console.log($(this).attr("href"));
        const scheme = $(this).attr("href").split(":")[0];
        if(scheme){
            switch(scheme){
                case "userlist":
                    showMiniFrame("userlist.html");
                    e.preventDefault();
                    break;
            }
        }
    });
    
});


const userMenu = function(cID,usr){
    const net = getNetwork(cID);
    const chan = hexDecode($("div.selected-item").attr("name"));
    menu.create([
        {
            title: usr
        },
        {
            text: lang.open_query,
            icon: "/images/comment-account.svg",
            more: false,
            nick: usr,
            callback: function(mo){
                GUI.openQuery(GUI.current.cID, mo.nick);
            }
        },
        {
            text: lang.user_info,
            icon: "/images/card-account-details.svg",
            more: false,
            nick: usr,
            callback: function(mo){
                net.sendData("WHOIS " + usr + " " + usr);
            }
        },
        {
            text: lang.version,
            icon: "/images/counter.svg",
            more: false,
            nick: usr,
            callback: function(mo){
                net.sendData("PRIVMSG " + usr + " :\u0001VERSION\u0001");
            }
        },
        {
            text: lang.ping,
            icon: "/images/sync.svg",
            more: false,
            nick: usr,
            callback: function(mo){
                net.sendData("PRIVMSG " + usr + " :\u0001PING " + Date.now() + "\u0001");
            }
        },
        
        {
            text: lang.ignore,
            icon: "/images/account-cancel.svg",
            more: false,
            nick: usr,
            callback: function(mo){
                const iu = usr + "!*@*";
                if(ignoreList.add(iu)){
                    //added
                    net.addChannelMessage(GUI.current.type, GUI.current.name, {
                        type: "info",
                        message: lang.ignored.replace("%n", iu)
                    });
                }else{
                    //already added
                    ignoreList.remove(iu);
                    net.addChannelMessage(GUI.current.type, GUI.current.name, {
                        type: "info",
                        message: lang.unignored.replace("%n", iu)
                    });
                }
            }
        },
        
        {text: "-"},
        
        {
            text: lang.moderation,
            icon: "/images/gavel.svg",
            more: true,
            nick: usr,
            callback: function(mo){
                    menu.create([
                        {
                            text: lang.kick,
                            icon: "",
                            more: false,
                            callback: function(mo){
                                net.sendData("KICK " + chan + " " + usr);
                            }
                        },
                        {
                            text: lang.ban,
                            icon: "",
                            more: false,
                            callback: function(mo){
                                for(let i in net.users){
                                    if(net.users[i][0].toLowerCase() == usr.toLowerCase()){
                                        net.sendData("MODE " + chan + " +b *!" + net.users[i][1].split("!")[1]);
                                        break;
                                    }
                                }
                            }
                        },
                        {
                            text: lang.kickban,
                            icon: "",
                            more: false,
                            callback: function(mo){
                                for(let i in net.users){
                                    if(net.users[i][0].toLowerCase() == usr.toLowerCase()){
                                        net.sendData("MODE " + chan + " +b *!" + net.users[i][1].split("!")[1]);
                                        break;
                                    }
                                }
                                net.sendData("KICK " + chan + " " + usr);
                            }
                        },
                        {
                            text: lang.kickban_reason,
                            icon: "",
                            more: false,
                            callback: function(mo){
                                const reason = prompt("Ban reason","Your behavior is not conducive to the desired environment");
                                for(let i in net.users){
                                    if(net.users[i][0].toLowerCase() == usr.toLowerCase()){
                                        net.sendData("MODE " + chan + " +b *!" + net.users[i][1].split("!")[1]);
                                        break;
                                    }
                                }
                                net.sendData("KICK " + chan + " " + usr + " :" + reason);
                            }
                        },
                        { text: "-" },
                        {
                            text: lang.op,
                            icon: "",
                            more: false,
                            callback: function(mo){
                                net.sendData("MODE " + chan + " +o " + usr);
                            }
                        },
                        {
                            text: lang.deop,
                            icon: "",
                            more: false,
                            callback: function(mo){
                                net.sendData("MODE " + chan + " -o " + usr);
                            }
                        },
                        {
                            text: lang.voice,
                            icon: "",
                            more: false,
                            callback: function(mo){
                                net.sendData("MODE " + chan + " +v " + usr);
                            }
                        },
                        {
                            text: lang.unvoice,
                            icon: "",
                            more: false,
                            callback: function(mo){
                                net.sendData("MODE " + chan + " -v " + usr);
                            }
                        }
                    ], {extend: true});
            }
        }
        
    ]);
}