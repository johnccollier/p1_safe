var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
const path = require("path");
var MongoStore = require('connect-mongo')(session);

//Set up mongoose connection
mongoose.connect('mongodb://dblem:blueteam123@ds263018.mlab.com:63018/blue_team_data');
const db = mongoose.connection;

//database error handling
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
	//Connected!
	console.log('Successfully connected to database');
  });

//Use sessions to keep track of logins
app.use(session({
	secret: 'cave raps',
	resave: true,
	saveUninitialized: false,
	store: new MongoStore({
		mongooseConnection: db
	})
}));

//parser for incoming requests
app.use(bodyParser.json());


app.use(express.urlencoded({ extended: false }));

//Include routers
var routes = require('./routes/router');
app.set("view engine", "ejs");
app.set('views', __dirname + '/views')
app.use('/', routes);


//Catch 404 errors and forwards to error handler
app.use(function (req, res, next) {
	var err = new Error('File Not Found');
	err.status = 404;
	next(err);
  });



/*
Error handler
Define as the last app.use callback 
*/
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.send(err.message);
  });



  
app.listen(3000, function () {
	console.log('Express app listening on port 3000!');
  });