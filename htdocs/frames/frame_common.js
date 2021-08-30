let lang = {};
let version = "Burd IRC 0.0.0 Beta";
const mouse = {x:0,y:0};

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
            $("div.menu").css("top", mouse.y).css("left", mouse.x - 5).hide().fadeIn(100);
        }else{
            $("body").append(menuHTML.replace("\"menu\"", "\"menu extended-menu\""));
            $("div.menu:last").css("top", mouse.y - 10).css("left", mouse.x - 10).hide().fadeIn(100);
        }
        if($("div.menu:last").position().top + $("div.menu:last").height() > $("#app").height()){
            $("div.menu:last").css("top", $("#app").height() - $("div.menu:last").height() - 10 );
        }
        if($("div.menu:last").position().left + $("div.menu:last").width() > $("#app").width()){
           // $("div.menu:last").css("left", $("#app").width() - $("div.menu:last").width() - 10 );
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
        


$(function(){
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
    
    $("body").on("click", "div.switch", function(e){
        if($(this).hasClass("off")){
            $(this).removeClass("off");
        }else{
            $(this).addClass("off");
        }
        switchChange({id: $(this).attr("id"), state: !$(this).hasClass("off")});
    });
});

window.addEventListener('message', function(e) {
    const data = e.data;
    switch(data.c){
        case "lang":
            lang = data.lang;
            setTimeout(function(){ onLanguage(); },100);
            break;
            
        case "version":
            version = data.version;
            break;
    }
});

window.parent.postMessage({c: "load_complete"}, '*');
window.parent.postMessage({c: "get_lang"}, '*');
window.parent.postMessage({c: "get_version"}, '*');
window.parent.postMessage({c: "get_settings"}, '*');


const randomID = function() {
    return 'axxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let switchChange = function(e){
    console.log(e);
}

let onLanguage = function(){};


const removeHTML = function(e){
    if(e==undefined) return "";
    return e.replace(/\&/g, "&amp;").replace(/\</g, "&lt;");
}


