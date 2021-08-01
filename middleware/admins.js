// middleware/users.js
require('dotenv').config();
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
const express = require("express");
const ejs = require("ejs");
const app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set("view engine", "ejs");

app.use(express.static("public"));

module.exports = {
isLoggedIna: (req, res, next) => {
  
  try {
    const token = req.cookies.authadmin;
    if(token){
    const decoded = jwt.verify(
      token,
      process.env.ADMINTOKEN
    );
    req.userData = decoded;
    return res.redirect("/admin/dashboard");
    }
    else{
      //return res.status(401).send('No Token');
	  next();
    }
  } catch (err) {
    /*return res.status(401).send({
      msg: 'Your session is not valid!'
    });*/
	next();
  }
},
isLoggedIn: (req, res, next) => {
  
  try {
    const token = req.cookies.authadmin;
    if(token){
    const decoded = jwt.verify(
      token,
      process.env.ADMINTOKEN
    );
    next();
    }
    else{
      return res.redirect("/admin/signin");
    }
  } catch (err) {
    return res.redirect("/admin/signin");
	
  }
}
};

