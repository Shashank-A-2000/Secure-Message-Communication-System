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
    const token = req.cookies.authuser;
    if(token){
    const decoded = jwt.verify(
      token,
      process.env.USERTOKEN
    );
    req.userData = decoded;
    return res.redirect("/user/inbox/"+decoded.userId);
    }
    else{
      
	  next();
    }
  } catch (err) {
    
	next();
  }
},
isLoggedIn: (req, res, next) => {
  
  try {
    const token = req.cookies.authuser;
    if(token){
    const decoded = jwt.verify(
      token,
      process.env.USERTOKEN
    );
    next();
    }
    else{
      return res.redirect("/user/signin");
    }
  } catch (err) {
    return res.redirect("/user/signin");
	
  }
}
};