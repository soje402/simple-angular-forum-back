var express = require('express'),
	path = require('path'),
	fs = require('fs'),
	app = express();


var api = require('./api');


//var staticRoot = __dirname + '/../front/dist/';


app.set('port', (process.env.PORT || 3000));

app.use('/api', api);

app.listen(app.get('port'), function() {
	console.log('app running on port', app.get('port'));
});