const userCommands = function(input, cID, type, channel){
    const net = getNetwork(cID);
    const bits = input.split(" ")
    
	const after = function(n){
		n = n + 1;
		let amount = 0;
		for (let i = 0; i < n; i++) {
			amount = amount + bits[i].length + 1;
		}
		return input.substr(amount);
	}
    
    
    for(let i in settings.userCommands){
        if(bits[0].substr(1).toLowerCase() == settings.userCommands[i][0].toLowerCase()){
            let rcmd = settings.userCommands[i][1];
            for (let a = 100; a > 0; a--) {
                if(rcmd.indexOf("&" + a) > -1){
                    rcmd = rcmd.replace("&" + a, after(a-2));
                }
                if(rcmd.indexOf("%" + a) > -1){
                    rcmd = rcmd.replace("%" + a, bits[a-1]);
                }
            }
            
            var d = new Date();
            rcmd = rcmd.replace(/\%c/g, channel);
            rcmd = rcmd.replace(/\%e/g, net.network);
            rcmd = rcmd.replace(/\%n/g, net.nick);
            rcmd = rcmd.replace(/\%t/g, d.toGMTString());
            rcmd = rcmd.replace(/\%v/g, version);
            
            
            console.log(rcmd);
            parseInput("/" + rcmd, cID, type, channel);
            return true;
        }
    }
    return false;
}


