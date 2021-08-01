// routes/router.js
require("dotenv").config();
const express = require('express');
const router = express.Router();
const ejs = require("ejs");

const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const nodemailer = require('nodemailer');

const db = require('../lib/db.js');
const adminMiddleware = require('../middleware/admins.js');
const app = express();
const generator = require('generate-password');
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set("view engine", "ejs");

router.use(express.static("public"));
// routes/router.js

let transporter = nodemailer.createTransport({
	service:"gmail",
	auth:{
		user:process.env.EMAIL,
		pass:process.env.PASSWORD
	}
});


router.get("/logout",(req,res)=>{
  res.clearCookie("authadmin");
  return res.redirect("/");
});

router.get("/dashboard",adminMiddleware.isLoggedIn,(req,res)=>{
	const query = "SELECT COUNT(*) AS usercount FROM users;SELECT COUNT(*) AS blockcount FROM users WHERE blocked = 1;SELECT COUNT(*) AS verifycount FROM users WHERE verified = 0; ";
	db.query(query,(err,results)=>{
		if(err)
			console.log(err);
		else{
			
			res.render("dashboard",{userscount:results[0][0].usercount,blockcount:results[1][0].blockcount,verifycount:results[2][0].verifycount});
		}
	});
});

router.get("/signin",adminMiddleware.isLoggedIna,(req,res)=>{
  res.render("adminlogin",{msg:""});
});

router.post('/signin', (req, res, next) => {
	const adminid = req.body.adminid;
    const password = req.body.password;
  db.query("SELECT * FROM admin WHERE aid = '"+adminid+"'",
    (err, results) => {
      // user does not exists
      if(err || results.length == 0){
            console.log(err);
            return res.render("adminlogin",{msg:"ID or Password is Incorrect"});
        }

      // check password
      bcrypt.compare(
        password,
        results[0]['password'],
        (bErr, bResult) => {
          // wrong password
          if (bErr) {
            console.log(err);
			return res.render("adminlogin",{msg:"ID or Password is Incorrect"});
          }

          if (bResult) {
            const token = jwt.sign({
                adminname: "admin",
                adminId: adminid,
              },
              process.env.ADMINTOKEN, {
                expiresIn: '1d'
              }
            );
            res.cookie('authadmin',token);
            return res.redirect("/admin/dashboard");
            
          }
          return res.render("adminlogin",{msg:"ID or Password is Incorrect"});
        }
      );
    }
  );
});

router.get("/verification",adminMiddleware.isLoggedIn,(req,res)=>{
		db.query("SELECT id,fname,lname,email_id,dob,phone FROM users WHERE verified = '0';",(err,results)=>{
			res.render("verification",{results:results});
		});
});

router.post("/verification/:userid",(req,res)=>{
	const userid = req.params['userid'];
	var password = generator.generate({
		length: 10,
		numbers: true
	});
	
	db.query("SELECT email_id FROM users WHERE id='"+userid+"';",(iderr,idresults)=>{
		
		if(iderr){
			res.send("Fail");
			console.log(iderr);
		}
		else{
			bcrypt.genSalt(10, function(salterr, salt) {
				bcrypt.hash(password, salt, function(hasherr, hash) {
					if(salterr || hasherr){
						res.send("Fail");
						console.log(salterr+" "+hasherr);
					}
					else{
					db.query("UPDATE users SET password='"+hash+"' WHERE id='"+userid+"';",(perr)=>{
						if(perr)
							res.send("Fail");
						else{
							var name = idresults[0]['email_id'].split("@",1);
							db.query("CREATE TABLE IF NOT EXISTS "+name+"(id VARCHAR(255),sender VARCHAR(30),recipient VARCHAR(30),title VARCHAR(30),date DATETIME,content TEXT,attempt CHAR(1));UPDATE users SET verified='1' WHERE id = '"+userid+"';",(merr)=>{
								if(merr){
									res.send("Fail");
									console.log(merr);
								}else{
									let mailOptions = {
										from: process.env.EMAIL,
										to: idresults[0]['email_id'],
										subject: "Your Verification is Successfull",
										html: "<div><h1>Secure Message Communication System Portal</h1><div><p>Your Account has been Verified Successfully, you can use the below password to login and make sure you change the password after loggingin<br>Password: " + password+"<br><h3>Thank You</h3></p></div></div>"
									};		
									transporter.sendMail(mailOptions,(err, data)=> {
										if (err){
											console.log(err);
											res.send("Fail");
										}
										else {
											console.log("Email Sent");
											res.send("Success");
										}
									});
								}
									
							});
						}
					});
					}
				});
			});
		}
	});
});

router.post("/remove/:userid",(req,res)=>{
	const userid = req.params['userid'];
	
	db.query("DELETE FROM users WHERE id = '"+userid+"';",(err)=>{
		if(err){
			console.log(err);
			res.send("Fail");
		}else{
			res.send("Success");
		}
	});
});

router.get("/manageusers",adminMiddleware.isLoggedIn,(req,res)=>{
	db.query("SELECT id,fname,lname,email_id,dob,phone FROM users",(err,results)=>{
		if(err)
			console.log(err);
		else
			res.render("man_users",{results:results});
	});
});

router.get("/blockedusers",adminMiddleware.isLoggedIn,(req,res)=>{
	db.query("SELECT id,fname,lname,email_id,dob,phone FROM USERS WHERE blocked = '1';",(err,results)=>{
		if(err)
			console.log(err);
		else	
	res.render("blockedusers",{results:results});
	});
});

router.post("/blockedusers/:userid",(req,res)=>{
	const userid = req.params['userid'];
	
	db.query("UPDATE users SET blocked = '0' WHERE id = '"+userid+"';",(err)=>{
		if(err){
			console.log(err);
			res.send("Fail");
		}
		else
			res.send("Success");
	});
});

router.get("/queries",adminMiddleware.isLoggedIn,(req,res)=>{
	db.query("SELECT * FROM contact_msg",(err,results)=>{
		if(err)
			console.log(err);
		else
			res.render("queries",{results:results});
	});
});

router.post("/queries/:msgid",(req,res)=>{
	const msgid = req.params['msgid'];
	db.query("DELETE FROM contact_msg WHERE id='"+msgid+"';",(err)=>{
		if(err){
			console.log(err);
			res.send("Fail");
		}
		else
			res.send("Success");
	});
});

// routes/router.js 


module.exports = router;