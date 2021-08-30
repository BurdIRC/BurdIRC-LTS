const tabSearch = {
    index: 0,
    items: [],
    search: "",
    original: ""
};

$(()=>{
    $("body").on("keydown", function(e) {
        if(e.ctrlKey && e.keyCode == 81){
            /* Ctrl + q = goes to the last unread channel */
            $("div.nav-item div.item-count:visible:first").click();
            e.preventDefault();
        }
    });
    
    $("div#chat-area").on("keydown", function(e) {
        if(!e.ctrlKey){
            $("input#input").focus();
        }
    });
    
    $("input#input").on("keydown", function(e) {
        if(e.keyCode == 9){
            e.preventDefault();
            if(e.shiftKey){
                /* shift+tab, switch channels */
                if($("div.selected-item:first").next().length == 0){
                    $("div.nav-item:first").click();
                }else{
                    if($("div.selected-item:first").hasClass("net-title")){
                        $("div.selected-item:first").parent().find("div.channels div.nav-item, div.pms div.nav-item")[0].click();
                    }else{
                        $("div.selected-item:first").next().click();
                    }
                }
                
            }else{
                const inputVal = $(this).val();
                const searchStr = inputVal.substr(inputVal.lastIndexOf(" ") + 1);
                const chan = currentChannel();
                inputHistory.index = 0;
                if(tabSearch.search == ""){
                    tabSearch.search = searchStr;
                    tabSearch.original = inputVal;
                    if(chan && chan.users){
                        for(let i in chan.users){
                            const chanUser = chan.users[i][0];
                            if(chanUser.length >= searchStr.length){
                                if(chanUser.substr(0, searchStr.length).toLowerCase() == searchStr.toLowerCase()){
                                    tabSearch.items.push(chan.users[i][0]);
                                }
                            }
                        }
                    }
                }
                
                if(tabSearch.items.length > 0){
                    $(this).val( tabSearch.original.substr(0, tabSearch.original.lastIndexOf(" ") + 1) + tabSearch.items[tabSearch.index] + " " );
                    tabSearch.index++;
                    if(tabSearch.items[tabSearch.index] == undefined) tabSearch.index = 0;
                }
                
            }
        }else if(e.keyCode == 38){
            /* up key */
            if(inputHistory.items.length == 0) return;
            $("input#input").val(inputHistory.items[inputHistory.index]);
            inputHistory.index += 1;
            if(inputHistory.index == inputHistory.items.length) inputHistory.index = 0;
            e.preventDefault();
            
        }else if(e.keyCode == 40){
            /* down key */
            if(inputHistory.items.length == 0) return;
            $("input#input").val(inputHistory.items[inputHistory.index]);
            inputHistory.index -= 1;
            if(inputHistory.index == -1) inputHistory.index = inputHistory.items.length - 1;
            e.preventDefault();
        }else{
            
            tabSearch.index = 0;
            tabSearch.items = [];
            tabSearch.search = "";
            tabSearch.original = "";
            inputHistory.index = 0;
        }
    });
    
});