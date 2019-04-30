setInterval(() => {
	let allFiles = document.getElementsByClassName("file-loader");
	if (allFiles[0].value != "") {
		for (let i = 0; i < allFiles.length - 1; i++) {
			if (allFiles[i].value != "" && allFiles[i + 1].value == "") {
				allFiles[i + 1].style.display = "flex";
			}
		}
	}
}, 33)