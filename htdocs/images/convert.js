const fs = require('fs');

fs.readdir("./", (err, files) => {
  files.forEach(file => {
	  if(file.slice(-4) == ".svg"){
            if (!fs.existsSync("./white/" + file)) {
                let data = fs.readFileSync('./' + file, {encoding:'utf8', flag:'r'});
                data = data.replace('<path d\=', "<path fill=\"#ffffff\" d=");
                data = data.replace('<path d\=', "<path fill=\"#ffffff\" d=");
                data = data.replace('<path d\=', "<path fill=\"#ffffff\" d=");
                data = data.replace('<path d\=', "<path fill=\"#ffffff\" d=");
                fs.writeFileSync('./white/' + file, data);
                console.log(file);
            }
	  }
    });
});