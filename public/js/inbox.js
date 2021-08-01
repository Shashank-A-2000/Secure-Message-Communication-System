function fun_key_request(msgid,senderid){
$.post("/user/keyrequest/"+msgid+"/"+senderid,(data,status)=>{
	if(data == "Success"){
		alert("Key Request Sent");
		window.location.reload();
	}
	else{
		alert("Failed to Send a Key request... Please try Again");
		window.location.reload();
	}
});
}

function fun_del(msgid,userid){
$.post("/user/del/"+msgid+"/"+userid,(data,status)=>{
	if(data == "Success"){
		alert("Message Deleted");
		window.location.reload();
	}
	else{
		alert("Failed to Delete the Message... Please try Again");
		window.location.reload();
	}
});
}