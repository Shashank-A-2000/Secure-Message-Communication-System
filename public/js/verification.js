function fun_verify(userid){
	
	$.post("/admin/verification/"+userid, (data, status) => {
        if (data == "Success"){
			alert("Verification Successfull");
			window.location.reload();
		}
        else {
                alert("Failed to Process... Please try Again");
                window.location.reload();
            }
    });
}

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