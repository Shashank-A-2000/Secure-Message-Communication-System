function fun_unblock(userid){
	$.post("/admin/blockedusers/"+userid,(data,status)=>{
		if(data == "Success"){
			alert("Successfully Unblocked");
			window.location.reload();
		}
		else{
			alert("Failed to Unblock User... Please try Again");
            window.location.reload();
		}
	});
}