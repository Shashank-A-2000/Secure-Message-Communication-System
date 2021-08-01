function fun_delete(msgid){
	$.post("/admin/queries/"+msgid,(data,status)=>{
		if(data == "Success"){
			alert("Successfully Deleted");
			window.location.reload();
		}
		else{
			alert("Failed to Delete Message... Please try Again");
            window.location.reload();
		}
	});
}