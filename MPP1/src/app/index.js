const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
  
const _FILE_TOO_BIG_ = "$FILE_TOO_BIG$";
const _SUCCESS_ = "$SUCCESS$";
const _NOTHING_TO_DELETE_ = "$NOTHING_TO_DELETE$";

const app = express();
const maxFileSize = 1024 * 1024;
const maxFileNameLengthBeforeCompression = 20;
const awaitedMaxFiles = 9;
const urlencodedParser = bodyParser.urlencoded({extended: false});

let allFileNames = [];
let originalFileNames = [];
let compressedFileNames = [];
let allFilesStatus = [];

app.use(fileUpload());
 
app.use(express.static(__dirname + '/public'));

app.get("/", urlencodedParser, function (request, response) {
    response.sendFile(__dirname + "/file-loader.html");
});

app.post('/download', function(request, response){
    if (!request.body) {
        return response.sendStatus(400);
    }

	let file;
	let fileOriginalName;
	for (let i = 0; i < allFileNames.length; i++) {
		if (request.body.hasOwnProperty(`downloader${i}`)) {
     		file = __dirname + '/server/' + allFileNames[i] + ".txt";
     		fileOriginalName = originalFileNames[i];
  		}
  	}

  	response.download(file, fileOriginalName);
});

app.post("/upload", urlencodedParser, function (request, response) {
    if (!request.body) {
    	return response.sendStatus(400);
    }

    let allFiles = [];
    for (let i = 0; i < awaitedMaxFiles; i++) {
    	if (request.files.hasOwnProperty(`file${i}`)) {
     		allFiles[i] = eval(`request.files.file${i}`);
  		}
    }

    for (let i = 0; i < allFiles.length; i++) {
    	if (allFiles[i].name.length > maxFileNameLengthBeforeCompression) {
    		compressedFileNames[i] = allFiles[i].name.substr(0, maxFileNameLengthBeforeCompression) + "...";
    	} else {
    		compressedFileNames[i] = allFiles[i].name;
    	}

    }

    for (let i = 0; i < allFiles.length; i++) {
	 	if (allFiles[i] != undefined) {
	 		originalFileNames[i] = allFiles[i].name;

	 		if (allFiles[i].data.length > maxFileSize) {
	 			allFilesStatus[i] = _FILE_TOO_BIG_;
	 		} else {
	 			loadFileToServerAndDoTask(request, response, allFiles[i], i);
			 	allFilesStatus[i] = _SUCCESS_;
			}
	 	}
	}

	const fs3 = require('fs');
	fs3.readFile(__dirname + '/results.html', "utf8", function (err, html) {
        if (err) {
            return console.log(err);
        }

		let newInfo = "";
	 	let newPage = html;
	 	for (let j = 0; j < allFiles.length; j++) {
	 		if (allFiles[j] != undefined) {
	 	 		newInfo += `<tr><td>${compressedFileNames[j]}</td>`;

            	switch (allFilesStatus[j]) {
            		case _FILE_TOO_BIG_:
            			newInfo += `<td class="fail">Провал</td>
            						<td>Недоступно</td>
            						<td>Размер файла превышал 1МБ`;
            			break;

            		case _SUCCESS_:
            			newInfo += `<td class="success">Успех</td>
            						<td>
            							<form action="/download" method="post" enctype="multipart/form-data">
                    						<input class="downloading-button" type="submit" name="downloader${j}" value="Скачать">
                						</form>
                					</td>
                					<td>-`;
            			break;

            		default:
            			newInfo += `<td class="fail">Провал</td>
            						<td>Недоступно</td>
            						<td>Неизвестная ошибка`;
            			break;
            	}
            		
    		}
    	}

	 	response.send(newPage.replace(new RegExp("{FILES-INFO}"), newInfo));
	});
});

function loadFileToServerAndDoTask(request, response, file, counter) {
	let fileName = getFileName();
	allFileNames[counter] = fileName;

	file.mv(__dirname + '/server/' + fileName + '.txt', function(err) {
    	if (err) {
    		return console.log(err);
    	}

   		const fs = require('fs');
   		fs.readFile(__dirname + '/server/' + fileName + '.txt', "utf8", function read(err, data) {
    		if (err) {
        		return console.log(err);
    		}

    		let content = data;

    		let remadeString =  deleteString(content, request.body.stringToBeChanged);

            content = data;

   			const fs2 = require('fs');
    		fs2.writeFile(__dirname + '/server/' + fileName + '.txt', remadeString, "utf8", function(err) {
    			if (err) {
        			return console.log(err);
    			}
			});
		}); 
	});
}

function getFileName() {
	const fileNameLength = 15;
	const symbolSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
	let fileName = "";

	for (let i = 0; i < fileNameLength; i++) {
		fileName += symbolSet[Math.floor(Math.random()*symbolSet.length)];
	}

	return fileName;
}

function deleteString(stringForWork, whatToChange) {
    let maxMatches = 0;
    var count = stringForWork.length;

    if (stringForWork.match(new RegExp(whatToChange, 'g')) != null) {
        maxMatches = stringForWork.match(new RegExp(whatToChange, 'g')).length;
    }

    if (count > maxMatches || count == 0) {
        count = maxMatches;
    }

    while (count > 0) {
        stringForWork = stringForWork.replace(new RegExp(whatToChange), "");
        count--;
    }

    return stringForWork;
} 

app.listen(3000);