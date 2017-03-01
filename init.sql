DROP TABLE IF EXISTS user;
CREATE TABLE user(
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  name TEXT UNIQUE,
  password TEXT
);

DROP TABLE IF EXISTS thread;
CREATE TABLE thread(
 	id INTEGER PRIMARY KEY AUTOINCREMENT,
  	title TEXT,
	post_id INTEGER,
	FOREIGN KEY(post_id) REFERENCES post(id)
);

DROP TABLE IF EXISTS post;
CREATE TABLE post(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	content TEXT,
	time_created INTEGER,
	thread_id INTEGER,
	user_id INTEGER,
	FOREIGN KEY(thread_id) REFERENCES thread(id),
	FOREIGN KEY(user_id) REFERENCES user(id)
);

CREATE INDEX post_on_thread ON post(thread_id);
CREATE INDEX post_on_user ON post(user_id);