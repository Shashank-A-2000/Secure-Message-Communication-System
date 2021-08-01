require("dotenv").config();
const express = require('express');
const router = express.Router();
const ejs = require("ejs");
const generator = require('generate-password');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require("path");
const db = require('../lib/db.js');
const userMiddleware = require('../middleware/users.js');
const app = express();
const nodemailer = require('nodemailer');
const uniqid = require('uniqid');
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));

let transporter = nodemailer.createTransport({
	service:"gmail",
	auth:{
		user:process.env.EMAIL,
		pass:process.env.PASSWORD
	}
});

app.set("view engine", "ejs");

router.use(express.static("userpublic"));

router.get("/logout",(req,res)=>{
  res.clearCookie("authuser");
  return res.redirect("/");
});

router.post("/forgotpassword",(req,res)=>{
	const email = req.body.email;
	
	db.query("SELECT * FROM users WHERE email_id = '"+email+"';",(err,results)=>{
		if(err)
			console.log(err);
		else{
			if(results.length === 0)
				res.send("Invalid");
			else{
				var password = generator.generate({
						length: 10,
						numbers: true
				});
				
				bcrypt.genSalt(10, function(salterr, salt) {
					bcrypt.hash(password, salt, function(hasherr, hash){
						if(hasherr)
							console.log(hasherr);
						else{
							db.query("UPDATE users SET password = '"+hash+"' WHERE email_id='"+email+"';",(uerr)=>{
								if(uerr)
									console.log(uerr);
								else{
									let mailOptions = {
										from: process.env.EMAIL,
										to: email,
										subject: "Your Requested New Password",
										html: "<div><h1>Secure Message Communication System Portal</h1><div><p>You can use the below password to login and make sure you change the password after logging in<br>Password: " + password+"<br><h3>Thank You</h3></p></div></div>"
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
				});
			}
		}
	});
});

var msg = [];
router.get("/signup",(req,res)=>{
	res.render("signup",{msg:msg});
	msg = [];
});

router.post("/signup",(req,res)=>{
	const fname = req.body.name;
	const lname = req.body.lname;
	const dob = req.body.dob;
	const mobile = req.body.mobile;
	const email = req.body.emailid;

	db.query("SELECT * FROM users WHERE email_id = '"+email+"'",(err,results)=>{
		if(err){
			console.log(err);
			msg.push("Failed to Register");
			msg.push("0");
			return res.redirect("/user/signup");
		}
		if(results.length > 0){
			
			msg.push("Email ID already Exists");
			msg.push("0");
			return res.redirect("/user/signup");
		}
		const id = uuid.v4();
		db.query("INSERT INTO users (id,fname,lname,email_id,dob,phone,verified,blocked) VALUES('"+id+"','"+fname+"','"+lname+"','"+email+"','"+dob+"','"+mobile+"','0','0')",(ierr)=>{
			if(ierr){
				console.log(err);
				msg.push("Failed to Register");
				msg.push("0");
				return res.redirect("/user/signup");
			}
			else{
				msg.push("Registered Successfully, Please wait for Verification");
				msg.push("1");
				return res.redirect("/user/signup");
			}
		});
	});
});

router.get("/inbox/:userid",userMiddleware.isLoggedIn,(req,res)=>{
	const userid = req.params['userid'];
	
	
	db.query("SELECT email_id FROM users WHERE id='"+userid+"';",(iderr,idresults)=>{
		if(iderr)
			console.log(err);
		else{
			
			var name = idresults[0]['email_id'].split("@",1);
			name = name[0];
			db.query("SELECT id,sender,recipient,title,date FROM "+name+";",(err,results)=>{
				if(err)
					console.log(err);
				else
					res.render("inbox",{results:results,userid:userid});
			});
		}
	});
});

router.get("/signin",userMiddleware.isLoggedIna,(req,res)=>{
  res.render("userlogin",{msg:""});
});

router.post('/signin', (req, res, next) => {
	const userid = req.body.userid;
    const password = req.body.password;
	
	db.query("SELECT * FROM users WHERE email_id = '"+userid+"'",
    (err, results) => {
      // user does not exists
      if(err || results.length == 0){
            console.log(err);
            return res.render("userlogin",{msg:"ID or Password is Incorrect"});
        }
		
	  if(results[0]['verified'] == '0'){
		    return res.render("userlogin",{msg:"Your account has not been verified"});

	  }
	  if(results[0]['blocked'] == '1'){
		    return res.render("userlogin",{msg:"Your account has been blocked"});

	  }

      // check password
      bcrypt.compare(
        password,
        results[0]['password'],
        (bErr, bResult) => {
          // wrong password
		  
          if (bErr) {
            console.log(err);
			return res.render("userlogin",{msg:"ID or Password is Incorrect"});
          }

          if (bResult) {
            const token = jwt.sign({
                username: results[0]['fname'] + " " + results[0]['lname'],
                userId: results[0]['id'],
              },
              process.env.USERTOKEN, {
                expiresIn: '1d'
              }
            );
            res.cookie('authuser',token);
			
            return res.redirect("/user/inbox/"+results[0]['id']);
            
          }
          return res.render("userlogin",{msg:"ID or Password is Incorrect"});
        }
      );
    }
  );
});

router.post("/del/:msgid/:userid",(req,res)=>{

	const msgid = req.params.msgid;
	const userid = ((req.params.userid).split("@",1))[0];

	db.query("DELETE FROM "+userid+" WHERE id='"+msgid+"';",(err)=>{
		if(err)
			res.send("Fail");
		else
			res.send("Success");
	});
	
});

router.post("/keyrequest/:msgid/:recieverid",(req,res)=>{
	
	const msgid = req.params.msgid;
	const recieverid = ((req.params.recieverid).split("@",1))[0];
	const id = uniqid();
	const date_obj = new Date();
    const cur_date = date_obj.getFullYear() + "-" + (date_obj.getMonth() + 1) + "-" + date_obj.getDate();
	
	db.query("SELECT sender,title FROM "+recieverid+" WHERE id='"+msgid+"';",(err,results)=>{
		if(err){
			console.log(err);
			res.send("Fail");
		}else{
			const senderid = results[0].sender;
			const title = results[0].title;
			db.query("INSERT INTO keyrequests VALUES('"+id+"','"+req.params.recieverid+"','"+senderid+"','"+title+"','"+cur_date+"');",(ins_err)=>{
				if(ins_err){
					console.log(ins_err);
					res.send("Fail");
				}
				else{
					res.send("Success");
				}
			});
		}
	});
	
});

router.get("/view/:msgid",userMiddleware.isLoggedIn,(req,res)=>{
	const msgid = req.params.msgid;
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	
	db.query("SELECT email_id FROM users WHERE id='"+userid+"';",(iderr,idresults)=>{
		if(iderr)
			console.log(iderr);
		else{
			const mailid = ((idresults[0].email_id).split("@",1))[0];
			
			db.query("SELECT sender,title,content FROM "+mailid+" WHERE id='"+msgid+"';",(err,results)=>{
				if(err)
					console.log(err);
				else
					res.render("msgview",{results:results,msgid:msgid,userid:userid});
			});
		}
	});
	
});

router.post("/reset/:msgid",(req,res)=>{
	const msgid = req.params.msgid;
	
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	
	db.query("SELECT email_id FROM users WHERE id='"+userid+"';",(iderr,idresults)=>{
		if(iderr)
			console.log(iderr);
		else{
			const mailid = ((idresults[0].email_id).split("@",1))[0];
			
			db.query("UPDATE "+mailid+" SET attempt='0' WHERE id='"+msgid+"';",(err,results)=>{
				if(err)
					console.log(err);
				else
					res.send("Success");
			});
		}
	});
	
});

router.post("/block/:msgid",(req,res)=>{
	const msgid = req.params.msgid;
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	
	db.query("SELECT email_id FROM users WHERE id='"+userid+"';",(iderr,idresults)=>{
		if(iderr)
			console.log(iderr+"\nYEs Its me");
		else{
			const mailid = ((idresults[0].email_id).split("@",1))[0];
			
			db.query("UPDATE "+mailid+" SET attempt=attempt+1 WHERE id='"+msgid+"';",(err,results)=>{
				if(err)
					console.log(err);
				else{
					db.query("SELECT attempt FROM "+mailid+" WHERE id='"+msgid+"';",(aerr,aresults)=>{
						if(aerr)
							console.log(aerr);
						else{
							if(aresults[0].attempt === '3'){
								db.query("UPDATE users SET blocked='1' WHERE id='"+userid+"';UPDATE "+mailid+" SET attempt='0' WHERE id='"+msgid+"';",(berr)=>{
									if(berr)
										console.log(berr);
									else
										return res.send("Blocked");
								});
								
							}
							else
								res.send("NULL");
						}
					});
				}
					
			});
		}
	});
});

router.get("/compose",userMiddleware.isLoggedIn,(req,res)=>{
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	
	db.query("SELECT email_id FROM users WHERE id='"+userid+"';",(iderr,idresults)=>{
		if(iderr)
			console.log(iderr);
		else{
			const mailid = idresults[0].email_id;
			res.render("compose",{userid:userid});
		}
	});
		
});

router.post("/compose",(req,res)=>{
	const cipher = req.body.cipher;
	const title = req.body.title;
	const recipient = req.body.recipient;
	const date_obj = new Date();
    const cur_date = date_obj.getFullYear() + "-" + (date_obj.getMonth() + 1) + "-" + date_obj.getDate();
	
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	
	db.query("SELECT * FROM users WHERE email_id='"+recipient+"';",(err,emailresults)=>{
		if(err || emailresults.length === 0)
				return res.send("Invalid");
		else{
			db.query("SELECT email_id FROM users WHERE id='"+userid+"';",(iderr,idresults)=>{
				if(iderr)
					console.log(iderr);
				else{
					const senderid = idresults[0].email_id;
					const id = uniqid();
					const reciever = (recipient.split("@",1))[0];
					
					db.query("INSERT INTO "+reciever+" VALUES('"+id+"','"+senderid+"','"+recipient+"','"+title+"','"+cur_date+"','"+cipher+"','0');",(ierr)=>{
						if(ierr){
							console.log(ierr);
							res.send("Fail");
						}else
							res.send("Success");
					});				
				}	
			});
		}
	});
});

router.get("/update",userMiddleware.isLoggedIn,(req,res)=>{
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	
	db.query("SELECT fname,lname,email_id,dob,phone FROM users WHERE id='"+userid+"';",(err,results)=>{
		if(err)
			console.log(err);
		else
			res.render("update",{result:results[0],userid:userid});
	});
	
});

router.post("/update",(req,res)=>{
	const password = req.body.pass;
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	bcrypt.genSalt(10,(salterr, salt)=> {
		bcrypt.hash(password, salt,(hasherr, hash)=> {
			if(hasherr){
				console.log(hasherr);
				res.send("Fail");
			}
			else{
				db.query("UPDATE users SET password = '"+hash+"' WHERE id='"+userid+"';",(uerr)=>{
					if(uerr){
						console.log(uerr);
						res.send("Fail");
					}
					else
						res.send("Success");
				});
			}
		});
	});	
});

router.get("/keyrequests",userMiddleware.isLoggedIn,(req,res)=>{
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	
	db.query("SELECT email_id FROM users WHERE id='"+userid+"';",(iderr,idresults)=>{
		if(iderr)
			console.log(iderr);
		else{
			const mailid = idresults[0]['email_id'];
			
			db.query("SELECT * FROM keyrequestS WHERE recipient='"+mailid+"';",(kerr,kresults)=>{
				if(kerr)
					console.log(kerr);
				else{
					res.render("keyrequests",{results:kresults,userid:userid});
				}
			});
		}
		
	});
	
});

router.get("/keydecrypt",userMiddleware.isLoggedIn,(req,res)=>{
	var userid;
	const token = req.cookies.authuser;
    if(token){
		const decoded = jwt.verify(
		token,
		process.env.USERTOKEN
		);
		userid = decoded.userId;
    }
	res.render("keydecrypt",{userid:userid});
});

module.exports = router;
