var fs = require('fs');

var public = fs.readFileSync('./keys/public.pem', 'utf8');
var private = fs.readFileSync('./keys/private.pem', 'utf8');

exports.getPublic = function(){
    return public;
}

exports.getPrivate = function(){
    return private;
}

var updateKeys = function()
{
    fs.readFile('./keys/public.pem', 'utf8', function(err, contents) {
        if(!err)
            public = contents;
    });
    fs.readFile('./keys/private.pem', 'utf8', function(err, contents) {
        if(!err)
            private = contents;
    });
}
setInterval(function(){
	updateKeys();
}, 10000);