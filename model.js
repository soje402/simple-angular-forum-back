var sqlite3 = require('sqlite3').verbose();
var jwt = require('jsonwebtoken');
var keys = require('./keys');

var db = new sqlite3.Database('test.db', function(err){
	if(err)
	{
		console.log(err)
	}
	else
		console.log('con on');
});

exports.ensureAuthorized = function(req, res, next){
    console.log('PROTECTER URL');
	var bearerToken;
	var bearerHeader = req.headers["authorization"];
	if(typeof bearerHeader !== 'undefined') {
		var bearer = bearerHeader.split(" ");
		bearerToken = bearer[1];
        jwt.verify(bearerHeader, keys.getPublic(), function(err, decoded){
			if(err) {
                console.log(err);
				res.status(401);
				res.json({
					err : ['Vous n\'êtes pas connecté']
				});
			}
			else {
				req.token_decoded = decoded;
				next();
			}
		});
	}
	else {
		res.status(401);
		res.json({
			err : ['Vous n\'êtes pas connecté']
		});
	}
};

exports.login = function(req, res) {
	console.log('body : ' + JSON.stringify(req.body));
	var query = `
SELECT u.id
FROM user u
WHERE u.name = '${req.body.pseudo}' AND u.password = '${req.body.password}'`;
	db.serialize(function(){
		console.log('query : ' + query);
		db.get(query, function(err, row){
			if(row) {
				console.log('login : send 200');
				var token = jwt.sign({
						user:row
					},
                    keys.getPrivate(),
                    {
						expiresIn: '7d', 
						algorithm: 'RS256'
					});
				res.status(200)
				.json({
					token: token,
					err : []
				});
			}
			else {
				console.log('login : send 401');
				res.status(401)
				.json({
					err : ['Combinaison use/pass invalide']
				});
			}
		});
	});
};

exports.register = function(req, res){
	let query = `
INSERT INTO user(name, password)
VALUES('${req.body.pseudo}', '${req.body.password}')`;
	console.log(query);
	db.serialize(function(){
		db.run(query, function(err){
			if(err)
			{
				console.log('register 401');
				res.status(401);
				res.json({
					err:['Le pseudo est déjà prit']
				});
			}
			else{
				console.log('register 200');
				var token = jwt.sign({
                        user:{
                            id:this.lastID
                        }
					},
                    keys.getPrivate(),
                    {
						expiresIn: '7d', 
						algorithm: 'RS256'
					});
				res.status(200);
				res.json({
					token: token,
					err : []
				});
			}
		});
	});

};

exports.postMessage = function(req, res){
    db.serialize(function(){
        let query = `
        INSERT INTO post(content, time_created, thread_id, user_id)
        VALUES ('${req.body.content}', '${Date.now()}', '${req.params.threadid}', '${req.token_decoded.user.id}')`;
        console.log(query);
        db.run(query, function(err){
            if(!err){
                res.status(200);
                res.json({
                    err : []
                });
            }
            else{
                console.log('erreur 15 : ');
                console.log(err);
                res.status(401);
                res.json({
                    err : ['Erreur du serveur']
                });
            }
        });
    });
};

exports.postThread = function(req, res){
	let query = `
INSERT INTO post(content, time_created, user_id)
VALUES('${req.body.content}', '${Date.now()}', '${req.token_decoded.user.id}')`;
	db.serialize(function(){
		console.log(query);
		db.run(query, function(err){
			if(!err){
				let postid = this.lastID;
				if(postid){
					query = `
INSERT INTO thread(title, post_id)
VALUES('${req.body.title}', '${postid}')`;
					console.log(query);
					db.run(query, function(err){
						if(!err){
							let threadid = this.lastID;
							query = `
UPDATE post 
SET thread_id = '${threadid}'
WHERE id = '${postid}'`;
							console.log(query);
							db.run(query, function(err){
								if(!err){
									res.status(200);
									res.json({
										threadid : this.lastID,
										err : []
									});
								}
								else{
									console.log('problem 0 : ' + err);
									res.status(401);
									res.json({
										err:['Votre topic n\'a pas pu être envoyé']
									});
								}
							});
							
						}
						else{
							console.log('error : ' + err);
							query = `
DELETE FROM post
WHERE id = '${id}'`;
							console.log(query);
							db.run(query, function(err){
								if(err){
									console.log('error : ' + err);
								}
							})
							res.status(401);
							res.json({
								err:['Votre topic n\'a pas pu être envoyé']
							});
						}
					});
				}
				else{
					console.log('problem 1');
					res.status(401);
					res.json({
						err:['Votre topic n\'a pas pu être envoyé']
					});
				}
			}
			else{
				console.log('error : ' + err);
				res.status(401);
				res.json({
					err:['Votre topic n\'a pas pu être envoyé']
				});
			}
		});
	});
	
	console.log(req.token_decoded.user.id);
	res.status(200);
};

exports.getThreads = function(req, res) {
	let offset = req.params.page * req.params.perpage;
	let last = offset + +req.params.perpage;
	console.log(req.params)
	console.log(typeof(offset) + ' ' + typeof(last));
	
	db.serialize(function(){
		let ret = {};
		let query = `
SELECT t.id, t.title, u.name, p.time_created
FROM thread t
LEFT JOIN post p ON t.post_id = p.id
LEFT JOIN user u ON p.user_id = u.id
ORDER BY p.time_created DESC
LIMIT ${req.params.perpage} OFFSET ${offset}`;
		console.log(query);
		db.all(query, function(err, rows){
			if(!err){
				ret.threadsPreviews = rows;

				query = `SELECT count(t.id) AS nb FROM thread t`;
				db.get(query, function(err, row){
					if(!err){
						ret.numTotalThread = row.nb;
						console.log(ret);
						res.status(200);
						res.json(ret);
					}
					else{
						console.log('error 4 : ' + err);
						res.status(401);
						return;
					}
				});
			}
			else{
				console.log('error 5 : ' + err);
				res.status(401);
				error = 1;
			}
		});
		
		
	});
};

exports.getThread = function(req, res) {
	let threadid = req.params.threadid;
	console.log(req.params);
	
	db.serialize(function(){
		let ret = {};
		let query = `
SELECT t.title
FROM thread t
WHERE t.id = '${threadid}'`;
		console.log(query);
		db.get(query, function(err, row){
			if(!err){
				ret.title = row.title;

				query = `
SELECT p.content, u.name AS author, p.time_created
FROM thread t
JOIN post p ON p.thread_id = t.id
JOIN user u ON p.user_id = u.id
WHERE t.id = ${threadid}
ORDER BY p.time_created ASC`;
				console.log(query);
				db.all(query, function(err, rows){
					if(!err){
						console.log('rows : ' + rows);
						ret.posts = rows;
						console.log(ret);
						res.status(200);
						res.json(ret);
					}
					else{
						console.log('error 6 : ' + err);
						res.status(401);
						return;
					}
				});
			}
			else{
				console.log('error 7 : ' + err);
				res.status(401);
				error = 1;
			}
		});
		
		
	});
};

