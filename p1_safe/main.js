const express = require('express');
const app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var sanitize = require('mongo-sanitize');
var sanitizeHtml = require('sanitize-html');
var sessions = require('express-session');
var csrf = require('csurf'); //security for CSRF attacks
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var cookieParser = require('cookie-parser');
var MongoDBStore = require('connect-mongodb-session')(sessions);
mongoose.set('useCreateIndex', true);
mongoose.set( 'useUnifiedTopology', true )
mongoose.set( 'useNewUrlParser', true )

//Set up mongoose connection
var store = new MongoDBStore({
  uri: 'mongodb://dblem:blueteam123@ds263018.mlab.com:63018/blue_team_data',
  collection: 'mySessions'
});

//setup local session
app.locals.sessionID = crypto.randomBytes(32).toString('base64');

var url = 'mongodb://dblem:blueteam123@ds263018.mlab.com:63018/blue_team_data';
mongoose.connect(url);
const db = mongoose.connection;

//database error handling
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
  //Connected!
  console.log('Successfully connected to database');
});


//import user model

const User = require('./models/user.js');
const Feedback = require('./models/feedback.js');

//setup template engine
app.set('views', __dirname + '/views');
app.set("view engine", "ejs");



//set up bower middleware
app.use(express.static('bower_components'));

//parser for incoming requests
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());





//Use sessions to keep track of logins
app.use(sessions({
  name: 'session',
  cookie: {
    maxAge: 1000 * 60 * 60,
    sameSite: false //used for CSRF
  },
  resave: false,
  saveUninitialized: false,
  secret: 'caveRaps',
  store: store
}));


//CSRF protection
//var csrfProtection = csrf({ cookie: true });
app.use(csrf());


//require login middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    res.redirect("/login");
  } else {
    next();
  }
}


function redirectHome(req, res, next) {
  if (req.session.userId) {
    res.redirect("/dashboard");
  } else {
    next();
  }
}

//Invalid CRSF token middleware
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)

  //CSRF token error hander
  res.status(403)
  res.send('Session has expired or form tampered with')
})

//Attach CSRF middleware
app.use(function(req, res, next) {
  res.locals._token = req.csrfToken()
  next()
})




//GET requests
app.get('/', function(req, res) {
  const { userId } = req.session
  console.log(userId)
  res.render("home", {csrfToken: req.csrfToken()});
});

app.get("/changeSession", function (req, res) {
  res.render('changeSession');
})


app.get('/register', redirectHome, function(req, res) {
  res.render("register", {csrfToken: req.csrfToken()});
});


app.get("/login", redirectHome, function (req, res) {

  // req.session.userId =
  res.render("login", {csrfToken: req.csrfToken()});

});


app.get("/contact", (req, res, next) => {
  return res.render("contact", {csrfToken: req.csrfToken()});
});


app.get("/dashboard", requireLogin,  (req, res, next) => {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return next(err);
        } else {
          console.log('welcome ' + user.email)
          res.render("dashboard", {FirstName: user.FirstName });
        }
      }
    });

});

app.get("/feedback", requireLogin, async function (req, res) {
  const comments = await Feedback.find( {} )
  res.render('feedback', {comments});
});


app.get('/logout', requireLogin, function(req,res){
  req.session.destroy(function (err) {
         res.redirect('/'); //Inside a callback… bulletproof!
     });
 });


//POST requests
app.post('/login', function(req,res){
    var email = sanitize(req.body.email);
    var password = sanitize(req.body.password);
  User.findOne({'email':req.body.email},function(err,user){
      if(err){
          res.send(err);
      }else if(user && user.validatePassword){
        req.session.userId = user._id;
          res.render('dashboard', {csrfToken: req.csrfToken(), FirstName: user.FirstName});
      }else {
          res.send('Wrong Username Password Combination');
      }
  })
});

app.post("/changeSession", function (req, res) {
  req.session.userId = req.body.id;
  res.send('session changed successfully')
})


app.post("/contact", function (req, res) {
  var name = sanitize(req.body.FullName)
  var email = sanitize(req.body.email)
  var comment = sanitizeHtml(req.body.comment)
  var userComment = {
    FullName: name,
    email: email,
    comment: comment
  }
  Feedback.create(userComment, function (error, user) {
    if (error) {
      return next(error);
    } else {
      res.send("Feedback received, thank you!");
    }
  });
})


app.post("/register", function (req, res, next) {
  var hash = req.body.password//bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
  var userData = {
    FirstName: req.body.FirstName,
    LastName: req.body.LastName,
    email: req.body.email,
    password: hash
  }
  User.create(userData, function (error, user) {
    if (error) {
      return next(error);
    } else {
      req.session.userId = user._id;
      res.redirect('/dashboard');
    }
  });




});




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

