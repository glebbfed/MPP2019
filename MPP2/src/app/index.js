const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
const iconv = require('iconv-lite');
  
const _FILE_TOO_BIG_ = "$FILE_TOO_BIG$";
const _SUCCESS_ = "$SUCCESS$";

const app = express();
const port = 3000;

const maxFileSize = 1024 * 1024;
const maxFileNameLengthBeforeCompression = 20;
const awaitedMaxFiles = 9;

let allFileNames = [];
let originalFileNames = [];
let compressedFileNames = [];
let allFilesStatus = [];

app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
app.use(express.static(__dirname + '/public'));

app.get("/", function (request, response) {
    response.sendFile(__dirname + "/file-loader.html");
});

app.get('/download', function(request, response) {
    if (!request.body) {
        return response.sendStatus(400);
    }

    let file;
    let fileOriginalName;
    let fileFound = false;;
    for (let i = 0; i < allFileNames.length; i++) {
        if (request.url.match(new RegExp(`\\?downloader${i}=`)) != null) {
            file = __dirname + '/server/' + allFileNames[i] + ".txt";
            fileOriginalName = originalFileNames[i];
            fileFound = true;
        }
    }

    if (fileFound) {
        response.status(200).download(file, fileOriginalName);
    } else {
        response.status(404).sendFile(__dirname + '/404.html');
    }
});

app.get('*', function(request, response) {
    response.status(404).sendFile(__dirname + '/404.html');
});

app.post("/upload", function (request, response) {
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
        if ((allFiles[i]) != undefined) {
            if (allFiles[i].name.length > maxFileNameLengthBeforeCompression) {
                compressedFileNames[i] = allFiles[i].name.substr(0, maxFileNameLengthBeforeCompression) + "...";
            } else {
                compressedFileNames[i] = allFiles[i].name;
            }
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
            return response.status(500).sendFile(__dirname + '/500.html');
        }

        let newInfo = "";
        let newPage = html;
        for (let j = 0; j < allFiles.length; j++) {
            if (allFiles[j] != undefined) {
                newInfo += `<tr id="deleter${j}"><td>${compressedFileNames[j]}</td>`;

                switch (allFilesStatus[j]) {
                    case _FILE_TOO_BIG_:
                        newInfo += `<td class="fail">Провал</td>
                                    <td>Недоступно</td>
                                    <td>Размер файла превышал 1МБ`;
                        break;

                    case _SUCCESS_:
                        newInfo += `<td class="success">Успех</td>
                                    <td>
                                        <form action="/download" method="get" enctype="multipart/form-data">
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
                            
                newInfo += `</td> 
                            <td>
                                <button type="submit" class="downloading-button" onclick="removeElement('deleter${j}')">Убрать</button>
                            </td>
                            </tr>`;
            }
        }

        if (response.statusCode != 500) {
            response.status(200).send(newPage.replace(new RegExp("{FILES-INFO}"), newInfo));
        }
    });
});

function loadFileToServerAndDoTask(request, response, file, counter) {
    let fileName = getFileName();
    allFileNames[counter] = fileName;

    file.mv(__dirname + '/server/' + fileName + '.txt', function(err) {
        if (err) {
            return response.status(500).sendFile(__dirname + '/500.html');
        }     

        const fs = require('fs');
        fs.readFile(__dirname + '/server/' + fileName + '.txt', function read(err, data) {
            if (err) {
                return response.status(500).sendFile(__dirname + '/500.html');
            }

            let content = iconv.decode(data, "win1251");
         
            let remadeString = deleteString(content, request.body.stringToBeChanged) 

            let winBuf = iconv.encode(remadeString, 'win1251');

            const fs2 = require('fs');
            fs2.writeFile(__dirname + '/server/' + fileName + '.txt', winBuf, function(err) {
                if (err) {
                    return response.status(500).sendFile(__dirname + '/500.html');
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

app.listen(port);