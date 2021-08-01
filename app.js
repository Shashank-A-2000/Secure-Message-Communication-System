const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const uniqid = require('uniqid');
const cors = require('cors');
const ejs = require("ejs");
var cookieParser = require('cookie-parser');
app.use(cookieParser());

const PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(cors());

const db = require("./lib/db.js");

// add routes
const routeradmin = require('./routes/adminrouter.js');
const routeruser = require('./routes/userrouter.js');
const routerkey = require('./stegnography.js');

app.use('/admin', routeradmin);

app.use('/user', routeruser);

app.use('/key',routerkey);

app.get("/",(req,res)=>{
    res.render("index");
});

var msg = [];

app.get("/contact",(req,res)=>{
    res.render("contact",{msg:msg});
    msg=[];
});

app.post("/contact",(req,res)=>{
    
    const name = req.body.name;
    const email = req.body.emailid;
    const content = req.body.content;
	const id = uniqid();

    const ins_query = "INSERT INTO contact_msg VALUES('"+id+"','"+name+"','"+email+"','"+content+"');";
    
    db.query(ins_query,(err)=>{
        if(err){
            console.log(err);
            msg.push("Message Failed to Send");
            msg.push('0');
            res.redirect('/contact');
        }
        else{
            console.log("Inserted into contact msg successfully");
            msg.push("Message Sent Successfully");
            msg.push('1');
            res.redirect('/contact');
        }
    });
});

// run server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
