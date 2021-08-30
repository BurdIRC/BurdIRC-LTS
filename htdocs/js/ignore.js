const ignoreList = {
    add: function(e){
        for(let i in settings.ignoreList){
            if(settings.ignoreList[i].toLowerCase() == e.toLowerCase()){
                return false;
            }
        }
        settings.ignoreList.push(e);
        return true;
    },
    remove: function(e){
        for(let i in settings.ignoreList){
            if(settings.ignoreList[i].toLowerCase() == e.toLowerCase()){
                settings.ignoreList.splice(i, 1);
                return true;
            }
        }
        return false;
    },
    test: function(e){
        for(let i in settings.ignoreList){
            const rn = this.userAsRegex(settings.ignoreList[i]);
            if(e.match(rn)) return true;
        }
        return false;
    },
    userAsRegex: function(e){
        let returnStr = "^";
        for( let i in e ) {
            returnStr += e[i].replace( /[^a-zA-Z\d\s\*:]/, "\\" + e[i] );
        }
        returnStr = returnStr.replace( /\s/g, "\\s" );
        returnStr = returnStr.replace( /\*/g, "(.*)" );
        returnStr += "$";
        return new RegExp(returnStr, "ig");
    }
}