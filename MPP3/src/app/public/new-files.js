setInterval(() => {
	let allFileContainers = document.getElementsByClassName("file-loader");
	let allFiles = document.getElementsByClassName("input-file");

	if (allFiles[0].value != "") {
		for (let i = 0; i < allFileContainers.length - 1; i++) {
			if (allFiles[i].value != "" && allFiles[i + 1].value == "") {
				allFileContainers[i + 1].style.display = "block";
			}
		}
	}
}, 33);