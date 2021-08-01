require('dotenv').config();
const express = require("express");
const router = express.Router();
const ejs = require("ejs");
const path = require("path");
const multer = require("multer");
const app = express();
const fs = require('fs');
const steggy = require('steggy-noencrypt');
const nodemailer = require('nodemailer');
const db = require('./lib/db.js');

app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
	
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    }
});

function sendMail(mailOptions) {
    transporter.sendMail(mailOptions,(err, data)=> {
        if (err)
            console.log(err);
        else {
            console.log("Email Sent");
        }
    });
}
	
var storage = multer.diskStorage({
	destination: function (req, file, cb) {

		cb(null, __dirname+"\\uploads")
	},
	filename: function (req, file, cb) {
	cb(null, "image"+ path.extname(file.originalname))
	}
})
	
var upload = multer({
	storage: storage,
	fileFilter: function (req, file, cb){
	
		var filetypes = /png/;
		var mimetype = filetypes.test(file.mimetype);

		var extname = filetypes.test(path.extname(
					file.originalname).toLowerCase());
		
		if (mimetype && extname) {
			return cb(null, true);
		}
	
		cb("Error: File upload only supports the "
				+ "following filetypes - " + filetypes);
	}


}).single("mypic");	
	
router.post("/encrypt",(req, res, next)=> {
	
	upload(req,res,(err)=> {
	const key = req.body.key;
	const kid = req.body.id;
	const title = req.body.title;
	const reciever = req.body.reciever;
		if(err) {
			console.log(err);
		}
		else {
			const original = fs.readFileSync(__dirname+"\\uploads\\image.png"); 
			
			const concealed = steggy.conceal(original, key);
			fs.writeFileSync(__dirname+"\\uploads\\output.png", concealed);
			
			var mailOptions = {
			from: process.env.EMAIL,
			to: reciever,
			subject: "Your Password for Message Titled- "+title+"",
			attachments: [
			{   
				filename: 'image.png',
				content: fs.createReadStream(__dirname+"\\uploads\\output.png")
      
			}]
			};
			sendMail(mailOptions);	
			db.query("DELETE FROM keyrequests WHERE id='"+kid+"';",(derr)=>{
				if(derr)
					console.log(derr);
				else
					res.redirect("/user/keyrequests");
			});		
		}
	})
});

router.post("/decrypt",(req,res,next)=>{
	upload(req,res,(err)=>{
		if(err)
			console.log(err);
		else{
			const cipherimage = fs.readFileSync(__dirname+"\\uploads\\image.png");
			try{    
				const revealed = steggy.reveal(cipherimage);
				res.send(revealed.toString());
			}
			catch{
				res.send("Fail");
			}
		}
	})
});
	
module.exports = router;