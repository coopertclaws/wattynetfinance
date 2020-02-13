require('dotenv').config();
var express = require('express');
var app = require('../app');
var router = express.Router();
const session = require('express-session');
const { ExpressOIDC } = require('@okta/oidc-middleware');
const okta = require("@okta/okta-sdk-nodejs");

//var app = express();

const client = new okta.Client({
  orgUrl: process.env.ORGURL,
  token: process.env.TOKEN
});

router.use((req, res, next) => {
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

// router.use((req, res, next) => {
//   if (!req.userinfo) {
//     return next();
//   }
//   oktaClient.getApplicationUser('0oaek3gxtYN8gGt7E356', req.userinfo.sub)
//     .then(user => {
//       req.user = user;
//       res.locals.user = user;
//       next();
//     }).catch(err => {
//       next(err);
//     });
// });

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(JSON.stringify(req.userContext.userinfo));
//  res.send(JSON.stringify(req.userContext.userinfo));
//  res.render('myprofile', { title: 'My Profile', given_name: req.userContext.userinfo.given_name, weight: req.userContext.userinfo.weight });
});

module.exports = router;