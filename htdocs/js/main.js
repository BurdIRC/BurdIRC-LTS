let version = "0.0.0"; //set by websocket backend
let release = "Beta"; //set by websocket backend

const settings = {
    "fileService": "https://api.haxed.net/0x0.php",
    "firstRun": false,
    "language": "english.json",
    "animation": 300,
    "maxHistory": 150,
    "mute": false,
    
    "showTimestamps": true,
    "showUnread": true,
    "showEmojis": true,
    "textColors": true,
    "showInputNick": true,
    "showNickColors": true,
    "showIdleStatus": true,
    
    "zoom": 1,
    
    "sounds": {
        "highlight": "/sounds/state-change_confirm-down.ogg",
        "pm": "/sounds/hero_simple-celebration-03.ogg",
        "notice": "/sounds/notification_simple-01.ogg",
        "popup": "/sounds/navigation_forward-selection.ogg",
        "error": "/sounds/alert_error-01.ogg"
    },
    
    "userCommands": [
        ["action", "me &2"],
        ["banlist","mode %c b"],
        ["dialog","query %2"],
        ["exit","quit"],
        ["j","join #&2"],
        ["kill","kill %2 :&3"],
        ["leave","part &2"],
        ["m","msg &2"],
        ["omsg","msg @%c &2"],
        ["onotice","notice @%c &2"],
        ["servhelp","help"],
        ["sping","ping"],
        ["squery","squery %2 :&3"],
        ["umode","mode %n &2"],
        ["uptime","stats u"],
        ["ver","ctcp %2 version"],
        ["version","ctcp %2 version"],
        ["wallops","wallops :&2"],
        ["wi","whois %2"],
        ["wii","whois %2 %2"],
        ["p","part"],
        ["leave","part"],
        ["c","clear"],
        ["ni","msg nickserv identify &2"],
        ["ns","nickserv &2"],
        ["cs","chanserv &2"]
    ],
    
    "highlights": [
        "%n"
    ],
    
    "ignoreList": [
    ]
};

const channelDefaults = {
    "show_joins": true,
    "show_parts": true,
    "show_kicks": true,
    "show_modes": true,
    "show_nick_changes": true,
    "mute_channel": false,
    "embed_media": false,
    "auto_join": false,
    "auto_rejoin": false
}

const emoji = [];

const servers = [
/*
    {
        guid: "a23eb07ede27eeefe1e",
        server: "irc.libera.chat",
        port: "6697",
        TLS: true,
        serverPassword: "",
        
        nick: "duckgoose",
        realName: "Matt",
        ident: "Burd",
        
        authType: "none",
        authUser: "",
        authPassword: "",
        authPEM: "",
        
        autoReconnect: true,
        onStartup: false,
        
        channelSettings: {
            
        },
        
        ignoreList: ["example!*@example.com"]
        
    }
    */
];

const lang = {};

const mouse = {x:0,y:0};


let ax = 0;
let atID = 0;
let frameLoadState = 0;

const showLoader = function(e){
    if(e){
        $("div#loader").show();
        atID = setInterval(function(){
            ax -= 100;
            $("div#loader").css("background-position-x", ax+"px");
            if(ax < -800) ax = 0;
        },70);
    }else{
        $("div#loader").hide();
        clearInterval(atID);
    }
}

const showMiniFrame = function(e){
    resizeWindow();
    if(e == 0){
        showLoader(0);
        $("iframe#mini").hide(settings.animation / 2, function(){
            $("div#miniframe").hide();
            $("iframe#mini").attr("src", "about:blank");
        });
    }else{
        frameLoadState = 2;
        setTimeout(function(){
            if(frameLoadState == 2) showLoader(1);
        },1000);
        $("div#miniframe").show();
        $("iframe#mini").show(settings.animation);
        $("iframe#mini").attr("src", "frames/" + e);
        
    }
    
}

const showIframe = function(e){
    resizeWindow();
    if(e == 0){

        $("iframe#fram").fadeOut(settings.animation, function(){
            $("div#app").fadeIn(settings.animation, function(){

            });
        });

        showLoader(0);
        
    }else{
        frameLoadState = 2;
        setTimeout(function(){
            if(frameLoadState == 2) showLoader(1);
        },1000);
        $("iframe#fram").attr("src", "frames/" + e);
        $("iframe#fram").hide();
        
        $("div#app").fadeOut(settings.animation, function(){
            $("iframe#fram").fadeIn(settings.animation);
        });

    }
}



const log = function(e){
    console.log( "[" + Date.now() + "] " + e);
}

let file = null;

function randomID() {
    return 'axxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function setupLanguage(){
    
}


function resizeWindow(){
    /*
    if(window.outerWidth > 850 && window.outerWidth < 1000){
        //window.resizeTo(window.outerWidth,600);
        settings.zoom = 0.9;
        $("body").css("zoom", settings.zoom);
    }else{
        settings.zoom = 1;
        $("body").css("zoom", settings.zoom);
    }
    */
    if(window.outerHeight < 600){
        window.resizeTo(window.outerWidth, 600);
    }
    if(window.outerWidth < 860){
        window.resizeTo(860, window.outerHeight);
    }
    
}


$(function(){
    
    document.title = "BurdIRC ";
    
    $(window).on("resize", function(){
        //resizeWindow();
    });
    resizeWindow();

    $.getJSON("languages/" + settings.language, function(data){
        for(let i in data){
            lang[i] = data[i];
        }
        setupLanguage();
    });
    
    $.getJSON("json/emoji.json", function(data){
        data = data.reverse();
        for(let i in data){
            emoji.push(data[i]);
        }
        emojiPane.default();
    });
    
    $('#file').change(function(){    
        const formdata = new FormData();
        if($(this).prop('files').length > 0){
            file = $(this).prop('files')[0];
            formdata.append("file", file);
        }
        jQuery.ajax({
            url: settings.fileService,
            type: "POST",
            data: formdata,
            processData: false,
            contentType: false,
            success: function (result) {
                 console.log(result);
                 $("#input").val($("#input").val() + result).focus();
            }
        });
    });
    
    if(settings.firstRun) showIframe("oobe.html");
    
    $("input#input").on("click", function(){
        $("div#emoji-selector").hide();
        emojiPane.default();
    });
    
    $("input#esearch").on("keypress", function(e){
        if(e.keyCode == "13") emojiPane.search($("input#esearch").val());
    });
    
    $("div#emoji").on("click", function(e){
        $("div#emoji-selector").fadeIn(settings.animation / 2);
    });
    $("div.close").on("click", function(e){
        $("div#emoji-selector").fadeOut(settings.animation / 2, function(){
            emojiPane.default();
            $("input#input").focus();
        });
    });
    
    $("body").on("click", "img.semoji", function(){
        $("input#input").val($("input#input").val() + emoji[$(this).attr("eid")].emojiId);
    });
    
    
    $("body").on("mousemove", function(e){
        mouse.x = e.pageX;
        mouse.y = e.pageY;
    });
    $("body").on("mousedown", function(e){
        if($(e.target).parents('div.menu').length == 0){
            $("div.menu").remove();
        }
    });
    $("body").on("mouseup", "div.menu-item", function(e){
        menu.call($(this).attr("id"));
    });
    $("body").on("mouseover", ".svgicon", function(e){
        $(this).attr("icon", $(this).css("background-image"));
        $(this).css("background-image", $(this).attr("icon").replace("D9E0EF", "FFFFFF"));
    });
    $("body").on("mouseout", ".svgicon", function(e){
        $(this).css("background-image", $(this).attr("icon"));
    });
});


const menu = {
    callbacks: {},
    create: function(e,a){
        if(a==undefined) a = {};
        if(a.extend==undefined){
            $("div.menu").remove();
        }else{
            $("div.extended-menu").remove();
        }
        let menuHTML = '<div class="menu">';
        for(let i in e){
            if(e[i].text == "-"){
                menuHTML += '<div class="menu-item menu-seperate">&nbsp;</div>';
            }else if(e[i].title != undefined){
                menuHTML += '<div class="menu-item menu-title">' + e[i].title + '</div>';
            }else{
                const mid = randomID();
                if(e[i].icon == ""){
                    menuHTML += '<div class="menu-item" id="' + mid + '">';
                }else{
                    menuHTML += '<div class="menu-item" id="' + mid + '" style="background-image:url(' + e[i].icon + ')">';
                }
                menuHTML += '<div class="menu-text">' + e[i].text + '</div>';
                if(e[i].more) menuHTML += '<div class="menu-more">&nbsp;</div>';
                menuHTML += '</div>';
                e[i].id = mid;
                menu.callbacks[mid] = e[i];
            }
        }
        menuHTML += '</div>';
        if(a.extend==undefined){
            $("body").append(menuHTML);
            $("div.menu").css("top", mouse.y).css("left", mouse.x - 10).hide().fadeIn(100);
        }else{
            $("body").append(menuHTML.replace("\"menu\"", "\"menu extended-menu\""));
            $("div.menu:last").css("top", mouse.y - 10).css("left", mouse.x - 10).hide().fadeIn(100);
        }
        if($("div.menu:last").position().top + $("div.menu:last").height() > $("#app").height()){
            $("div.menu:last").css("top", $("#app").height() - $("div.menu:last").height() - 10 );
        }
        if($("div.menu:last").position().left + $("div.menu:last").width() > $("#app").width()){
            $("div.menu:last").css("left", $("#app").width() - $("div.menu:last").width() - 10 );
        }
    },
    call: function(e){
        if(menu.callbacks[e].more){
            
        }else{
            $("div.menu").remove();
        }
        menu.callbacks[e].callback(menu.callbacks[e]);
    }
}


window.addEventListener('message', function(e) {
    // Get the sent data
    const data = e.data;
    log("Message event: " + data.c);
    switch(data.c){
        case "get_channel_users":
            const net = getNetwork(data.cid);
            for(let i in net.channels){
                if(net.channels[i].name.toLowerCase() == data.name.toLowerCase()){
                    e.source.postMessage({c: "channel_users", users: net.channels[i].users}, '*');
                }
            }
            break;
            
        case "get_current_channel":
            e.source.postMessage({c: "current_channel", cid: $("div.selected-item").attr("cid"), name: hexDecode($("div.selected-item").attr("name")) }, '*');
            break;
        
        case "load_complete":
            showLoader(0);
            frameLoadState = 1;
            break;
        
        case "add_network":
            servers.push(data.network);
            e.source.postMessage({c: "network_added"}, '*');
            break;
        
        case "close_iframe":
            $("iframe#fram").hide().attr("src", "about:blank");
            showIframe(0);
            break;
        case "close_miniframe":
            showMiniFrame(0);
            break;
        case "get_version":
            e.source.postMessage({c: "version", version: "Burd IRC " + version + " " + release}, '*');
            break;
        case "get_lang":
            e.source.postMessage({c: "lang", lang: lang}, '*');
            break;
        case "get_settings":
            e.source.postMessage({c: "settings", settings: settings}, '*');
            break;
        case "set_settings":
            for(let i in settings){
                settings[i] = data.settings[i];
            }
            e.source.postMessage({c: "settings_set"}, '*');
            applySettings();
            break;
        case "get_channel_settings":
            e.source.postMessage({c: "channel_settings", settings: getChannelSettings(data.guid, data.channel)}, '*');
            break;
        case "set_channel_settings":
            saveChannelSettings(data.guid, data.channel, data.settings)
            break;
        case "get_servers":
            e.source.postMessage({c: "servers", servers: servers}, '*');
            break;
        case "get_server":
            for(let i in servers){
                if(servers[i].guid == data.id){
                    e.source.postMessage({c: "server", server: servers[i]}, '*');
                }
            }
            break;
        case "edit_server":
            console.log(data.server.guid);
            for(let i in servers){
                if(servers[i].guid == data.server.guid){
                    servers[i] = data.server;
                    e.source.postMessage({c: "server_edited"}, '*');
                }
            }
            break;
        case "edit_servers":
            for(let i in servers){
                servers[i] = data.servers[i];
            }
            break;
        case "remove_server":
            for(let i in servers){
                if(servers[i].guid == data.id){
                    servers.splice(i, 1);
                }
            }
            e.source.postMessage({c: "servers", servers: servers}, '*');
            break;
        case "connect":
            for(let i in servers){
                if(servers[i].guid == data.id){
                    const cID = (networks.length == 0 ? "1" : networks.length);

                    GUI.createNetwork({
                        connectionID: cID,
                        guid: servers[i].guid,

                        server: {
                            address: servers[i].server,
                            port: servers[i].port,
                            TLS: servers[i].TLS,
                            cert: servers[i].authPEM,
                            password: servers[i].serverPassword,
                            reconnect: servers[i].autoReconnect
                        },

                        userInfo: {
                            nick: servers[i].nick.replace("*", randomID().substr(1,5)),
                            ident: servers[i].ident,
                            name: servers[i].realName,
                            auth: {
                                type: servers[i].authType,
                                username: servers[i].authUser,
                                password: servers[i].authPassword
                            }
                        }

                    });
                }
            }
            break;
    }
});



const removeHTML = function(e){
    if(e==undefined) return "";
    return e.replace(/\&/g, "&amp;").replace(/\</g, "&lt;");
}

const linkify = function(e) {
    // http://, https://, ftp://
    const urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;\(\)]*[a-z0-9-+&@#\/%=~_|\(\)]/gim;

    // www. sans http:// or https://
    const pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

    // Email addresses
    const emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

    return e
        .replace(urlPattern, '<a href="$&" target="_blank">$&</a>')
        .replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
        .replace(emailAddressPattern, '<a href="mailto:$&" target="_blank">$&</a>');
}
const hexEncode = function(e){
    let hex, i;

    let result = "";
    for (i=0; i<e.length; i++) {
        hex = e.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
}
const hexEncodeS = function(e){
    let hex, i;

    let result = "";
    for (i=0; i<e.length; i++) {
        hex = e.charCodeAt(i).toString(16);
        result += "\\u" + ("000"+hex).slice(-4);
    }

    return result
}
const hexDecode = function(e){
    if(e == undefined) return "";
    let j;
    let hexes = e.match(/.{1,4}/g) || [];
    let back = "";
    for(j = 0; j<hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16));
    }

    return back;
}

const emojiLoaded = function(){
    //log("emoji loaded");
    const ca = $('#chat-area');
    ca.scrollTop(ca.prop("scrollHeight"));
}

const emojify = function(e){
    for(let i in emoji){
        if(e.indexOf(emoji[i].emojiId) > -1){
            let re = new RegExp(hexEncodeS(emoji[i].emojiId), "g");
            e = e.replace(re, '<img onload="emojiLoaded();" class="emoji" src="' + emoji[i].image.thumbnails[0].url + '">');
        }
    }
    return e;
}

const emojiPane = {
    search: function(e){
        if(e == "") return this.default();
        e = e.toLowerCase();
        const terms = e.split(" ");
        $("div#emoji-content").html("");
        let found = 0;
        for(let i in emoji){
            for(let j in terms){
                if(emoji[i].searchTerms && emoji[i].searchTerms.includes(terms[j])){
                    $("div#emoji-content").append('<img src="' + emoji[i].image.thumbnails[0].url  + "?" + i + '" class="semoji" eid="' + i + '">');
                    found++;
                    break;
                }
            }
            if(found > 100) break;
        }
    },
    default: function(){
        $("div#emoji-content").html("");
        $("input#esearch").val("");
        const defaults = [1926, 1996, 1989, 3094, 1925, 1933, 2090, 1932, 3090, 2080, 2081, 1996, 2004, 1957, 1938, 1965, 2076, 2075, 2064, 2085, 1922, 2654, 1949, 2008, 1929, 2068, 1946, 1961, 1979, 1931, 1997, 1960, 1955, 2051, 1956, 1935, 2032, 2106, 1962, 2063, 1958, 1999, 1982, 1884, 2264];
        for(let i in defaults){
            $("div#emoji-content").append('<img src="' + emoji[defaults[i]].image.thumbnails[0].url + '" class="semoji" eid="' + defaults[i] + '">');
        }
        
    }
}

const onlyEmojis = function(e){
    e = e.replace(/s/g, "");
    for(let i in emoji){
        if(e.indexOf(emoji[i].emojiId) > -1){
            let re = new RegExp(hexEncodeS(emoji[i].emojiId), "g");
            e = e.replace(re, '');
        }
    }
    
    return (e == "");
}


const hasEmojis = function(e){
    for(let i in emoji){
        if(e.indexOf(emoji[i].emojiId) > -1) return true;
    }
    return false;
}

const colors = {
    strip: function( e ) {
        e = e.replace( /\u0003[0-9][0-9]?(,[0-9][0-9]?)?|\u0003/ig, "" );
        e = e.replace( /\u0008|\u0002|\x1F|\x0F|\x11|\x1E/ig, "" );
        return e;
    },
    parse: function( e ) {
        if(typeof(e) == "string"){
            if(settings.textColors){
                e = this.parseColors( e );
                e = this.parseBold( e );
                e = this.parseItalic( e );
                e = this.parseUnderline( e );
                e = this.parseStrike( e );
                e = this.parseMonospace( e );
            }
            e = this.strip( e );
        }
        return e;
    },
    parseColors: function( e ) {
        /*  */
        let c = e.match( /\u0003[0-9][0-9]?(,[0-9][0-9]?)?/ig, "" );
        let newText = e;
        let colors = [ 
            "#FFFFFF","#000000","#000080",
            "#008000","#FF0000","#A52A2A",
            "#800080","#FFA500","#FFFF00",
            "#00FF00","#008080","#00FFFF",
            "#4169E1","#FF00FF","#808080",
            "#C0C0C0","transparent"
        ];
        
        if ( c == null ) return e; /* no colors, no need to go on */
        
        let nt = 0;
        
        for ( let i in c ) {
            /* now lets loop the matches */
            let BG = 16;
            let FG = 16;
            let m = c[i].substr( 1 ).split( "," );
            if ( m.length == 2 ) BG = parseInt( m[1] );
            FG = parseInt( m[0] );
            if ( FG > 16 || BG > 16 || BG < 0 || FG < 0 ) return this.strip( e );
            BG = colors[BG];
            FG = colors[FG];
            newText = newText.replace( c[i], '<span style="color:' + FG + ';text-shadow:none;background:' + BG + '">' );
            nt += 1;
        }
        
        newText = newText.replace( /\u0003/g, "</span>" );
        let tnt = newText.match( /<\/span>/g );
        if ( tnt != null ) nt = nt - tnt.length;
        
        if ( nt < 0 ) return this.strip( e );
        
        while ( nt > 0 ) {
            nt -= 1;
            newText += "</span>";
        }
        
        if ( nt != 0 ) return this.strip( e );
        
        tnt = newText.match( /<\/?span/g );
        
        nt = 0;
        
        for ( let i in tnt ) {
            if ( tnt[i] == "<span" ) nt += 1;
            if ( tnt[i] == "</span" ) {
                if ( nt < 1 ) return this.strip( e );
                nt = nt - 1;
            }
        }

        return newText;
    },
    parseBold: function( e ) {
        let c = e.match( /\u0002/g, "" );
        let nt = 0;
        for ( let i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\u0002/, '<span style="font-weight:bold;text-shadow:none;">' );
            } else {
                nt = 0;
                e = e.replace( /\u0002/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    },
    parseItalic: function( e ) {
        let c = e.match( /\x1D/g, "" );
        let nt = 0;
        for ( let i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\x1D/, '<span style="font-style:italic;text-shadow:none;">' );
            } else {
                nt = 0;
                e = e.replace( /\x1D/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    },
    parseUnderline: function( e ) {
        let c = e.match( /\x1F/g, "" );
        let nt = 0;
        for ( let i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\x1F/, '<span style="text-decoration:underline;text-shadow:none;">' );
            } else {
                nt = 0;
                e = e.replace( /\x1F/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    },
    parseStrike: function( e ) {
        let c = e.match( /\x1E/g, "" );
        let nt = 0;
        for ( let i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\x1E/, '<span style="text-decoration: line-through;text-shadow:none;">' );
            } else {
                nt = 0;
                e = e.replace( /\x1E/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    },
    parseMonospace: function( e ) {
        let c = e.match( /\x11/g, "" );
        let nt = 0;
        for ( let i in c ) {
            if ( nt == 0 ) {
                nt = 1;
                e = e.replace( /\x11/, '<span style="font-family: Courier, Monaco, \'Ubuntu Mono\', monospace;">' );
            } else {
                nt = 0;
                e = e.replace( /\x11/, '</span>' );
            }
        }
        if ( nt == 1 ) e += "</span>";
        return e;
    }
}


const getChannelSettings = function(guid, chan){
    for(let i in servers){
        if(servers[i].guid == guid){
            if(servers[i].channelSettings[chan.toLowerCase()] != undefined) return servers[i].channelSettings[chan.toLowerCase()];
        }
    }
    return channelDefaults;
}

const saveChannelSettings = function(guid,chan,settings){
    if(settings == channelDefaults){
        return;
    }
    for(let i in servers){
        if(servers[i].guid == guid){
            servers[i].channelSettings[chan.toLowerCase()] = settings;
        }
    }
}

const playSound = function(e){
    if(settings.mute) return;
    $("audio#audioe").remove();
    $("body").append('<audio id=audioe><source src="' + e + '" type="audio/mpeg"></audio>');
    $("audio#audioe")[0].play();
    
}

const applySettings = function(){
    settings.showInputNick ? $("div#my-nick").show() : $("div#my-nick").hide();
    
    if(settings.showTimestamps){
        $("style#no_date_style").remove();
    }else{
        $("style#no_date_style").remove();
        $("head").append('<style id="no_date_style">div.messagedate{display:none;};</style>');
    }
}

const currentChannel = function(){
    const net = getNetwork($("div.selected-item:first").attr("cid"));
    const selName = hexDecode($("div.selected-item:first").attr("name"));
    for(let i in net.channels){
        if(net.channels[i].name.toLowerCase() == selName.toLowerCase()){
            return net.channels[i];
        }
    }
    return false;
}

const loadToObject = function(name, obj){
    if(localStorage[name] == undefined) return;
    const data = JSON.parse(localStorage[name]);
    for(let i in data){
        obj[i] = data[i];
    }
}

loadToObject("settings", settings);
log("Loaded general settings");

if(localStorage["servers"] != undefined){
    const serverData = JSON.parse(localStorage["servers"]);
    for(let i in serverData){
        servers.push(serverData[i]);
    }
    log("Server data was loaded");
}else{
    servers.push([
      {
        "guid": "defaultaddedserver",
        "server": "irc.libera.chat",
        "port": "6697",
        "TLS": true,
        "serverPassword": "",
        "nick": "Guest_*",
        "realName": "BurdIRC",
        "ident": "BurdIRC",
        "authType": "none",
        "authUser": "",
        "authPassword": "",
        "authPEM": "",
        "autoReconnect": true,
        "onStartup": false,
        "channelSettings": {},
        "ignoreList": [],
        "highlights": []
      }
    ]);
}


window.addEventListener('beforeunload', function (e) {
    localStorage.setItem("settings", JSON.stringify(settings));
    localStorage.setItem("servers", JSON.stringify(servers));
    cs.ws.send('[":0 CLOSED"]');
});