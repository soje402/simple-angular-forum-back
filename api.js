var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var model = require('./model');
var bodyParser = require('body-parser');



router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(function(req, res, next) {
	console.log('\n\nMIDDLEWARE called.\n\n');
	// allows requests fromt angularJS frontend applications
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    next();
});

router.post('/login', model.login);
router.post('/register', model.register);
router.get('/threads-:page-:perpage', model.getThreads);
router.post('/threads', model.ensureAuthorized, model.postThread);
router.get('/thread/:threadid', model.getThread);
router.post('/thread/:threadid', model.ensureAuthorized, model.postMessage);




module.exports = router;