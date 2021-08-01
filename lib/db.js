
const mysql = require("mysql");

const con = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    multipleStatements:true
});

con.connect((err)=>{
    if(err)
        console.log(err);
    else    
        console.log("Connect to database Successfully");
});


con.query("CREATE DATABASE IF NOT EXISTS smcs",(err)=>{
    if(err)
        console.log(err);
    else
        console.log("Database created successfully");
});

con.query("USE smcs",(err)=>{
    if(err)
        console.log(err);
    else    
        console.log("Database Changed");
});

const admin_table = "CREATE TABLE IF NOT EXISTS admin(aid VARCHAR(30) PRIMARY KEY,password TEXT)";

con.query(admin_table,(err)=>{
    if(err)
        console.log(err);
    else
        console.log("Admin Table created successfully");
});

con.query("SELECT * FROM admin;",(err,results)=>{
	if(err)
		console.log(err);
	else if(results.length === 0){
		con.query("INSERT INTO admin VALUES('admin@gmail.com','$2b$10$bJC2mF/4THn4Mvz4D5v5FOAV0E3skp4n8Has7gvCNzK2GT8MyMZ/O');",(ierr)=>{
			if(ierr)
				console.log(ierr);
			else
				console.log("Inserted Into admin table");
		});
	}
});

const user_table = "CREATE TABLE IF NOT EXISTS users(id VARCHAR(255) PRIMARY KEY,password TEXT, fname VARCHAR(20), lname VARCHAR(10),email_id VARCHAR(30) UNIQUE, dob  DATE, phone VARCHAR(10),verified CHAR(1),blocked CHAR(1))";

con.query(user_table,(err)=>{
    if(err)
        console.log(err);
    else
        console.log("User table created successfully");
});

const key_table = "CREATE TABLE IF NOT EXISTS keyrequests(id VARCHAR(255) PRIMARY KEY, sender VARCHAR(30), recipient VARCHAR(30), title VARCHAR(50), date DATE)";

con.query(key_table,(err)=>{
    if(err)
        console.log(err);
    else
        console.log("Key Request Table created Successfully");
});

const contact_table = "CREATE TABLE IF NOT EXISTS contact_msg(id VARCHAR(255) PRIMARY KEY, name VARCHAR(30), email VARCHAR(30), content text)";

con.query(contact_table,(err)=>{
    if(err)
        console.log(err);
    else
        console.log("Contact Table created successfully");
});

module.exports = con;

