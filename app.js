require('dotenv').config();
var db = require('./db');

//var mysql = require('mysql');
const session = require('express-session');
const { ExpressOIDC } = require('@okta/oidc-middleware');
var okta = require("@okta/okta-sdk-nodejs");

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const basicAuth = require('express-basic-auth');

const OktaJwtVerifier = require('@okta/jwt-verifier');

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTAJWTURL,
  clientId: process.env.CLIENT_ID
  // assertClaims: {
  //   aud: 'api://default'
  // }
});


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var myprofileRouter = require('./routes/myprofile');

var app = module.exports = express();

function authenticationRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    res.status(401);
    return next('Not Today!');
  }

  const accessToken = match[1];
  const expectedAudience = 'api://default';

  return oktaJwtVerifier.verifyAccessToken(accessToken, expectedAudience)
    .then((jwt) => {
      req.jwt = jwt;
      next();
    })
    .catch((err) => {
      res.status(401).send(err.message);
    });
}

// app.all('*', authenticationRequired);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: false
}));

var oktaClient = new okta.Client({
  orgUrl: process.env.ORGURL,
  token: process.env.TOKEN
});

const oidc = new ExpressOIDC({
  issuer: process.env.ISSUER,
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  appBaseUrl: process.env.APPBASEURL,
  redirect_uri: process.env.REDIRECT_URI,
  scope: 'openid profile'
});

app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }
  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});

// app.use(basicAuth({
//   users: { admin: `${process.env.ADMINPASS}` },
//   challenge: true
// }));


app.use('/', indexRouter);
app.use('/api/users', authenticationRequired, usersRouter);
app.use('/myprofile', oidc.ensureAuthenticated(), myprofileRouter);
app.get('/api/messages', authenticationRequired, (req, res) => {

  res.json({
    messages: [
      {
        date:  new Date(),
        text: 'I am a robot.'
      },
      {
        date:  new Date(new Date().getTime() - 1000 * 60 * 60),
        text: 'Hello, world!'
      }
    ]
  });
});

// app.use(function (err, req, res, next) {
//   if (err) {
//     console.log('Error', err);
//   } else {
//     console.log('404')
//   }
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// redundant comment

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  console.log(err);
});

module.exports = app;
