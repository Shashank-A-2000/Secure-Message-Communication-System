function fun_remove(userid){
	$.post("/admin/remove/"+userid,(data,status)=>{
		if(data == "Success"){
			alert("Successfully Removed");
			window.location.reload();
		}
		else{
			alert("Failed to Remove User... Please try Again");
            window.location.reload();
		}
	});
}