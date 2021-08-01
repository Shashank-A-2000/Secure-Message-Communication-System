$("#decbut").click((event)=>{
	event.preventDefault();
	var form=$('#decform')[0];
	var data = new FormData(form);
	$.ajax({
		type:"POST",
		enctype:'multipart/form-data',
		url:"/",
		data:data,
		processData:false,
		contentType:false,
		cache:false,
		success:function(data){
			if(data === "Fail")
				alert("Invalid Image");
			else{
				document.getElementById("key").value = data;
			}
		},
		error:function(e){
			console.log(e);
		}
	});
});