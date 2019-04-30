fillWithUploadButtons(8);
setUploadButtonStyle(14);

function fillWithUploadButtons(numberOfButtons) {
    let filler = document.getElementById("fill-me");
    let button = "";
    for (let i = 1; i <= numberOfButtons; i++) {
        button += `<div class="file-loader file-extra">  
                        <input class="input-file" id="my-file${i}" type="file" name="file${i}">
                        <label for="my-file${i}"></label>
                        <label for="my-file${i}" class="input-file-trigger">Выберите файл...</label>
                   </div>`;
    }

    filler.innerHTML = filler.innerHTML.replace(new RegExp("{FILL_HERE}"), button)
}

function setUploadButtonStyle(maxFileNameLength) {
    let fileInput  = document.getElementsByClassName("input-file"); 
    let button = document.getElementsByClassName("input-file-trigger");
      
    for (let i = 0; i < fileInput.length; i++) {
        button[i].addEventListener("keydown", function(event) {  
        if (event.keyCode == 13 || event.keyCode == 32 ) {  
            fileInput[i].focus();  
        }  
        });

        button[i].addEventListener("click", function(event) {
            fileInput[i].focus();       
            return false;
        });  

        fileInput[i].addEventListener("change", function(event) {  
            let stringForChanges = this.value;
            stringForChanges = stringForChanges.replace(/.+\\/, "");

            if (stringForChanges.length > maxFileNameLength) {
                button[i].innerHTML = stringForChanges.substr(0, maxFileNameLength) + "...";
            } else {
                button[i].innerHTML = stringForChanges;
            }
 
            if (button[i].innerHTML == "") {
                button[i].innerHTML = "Выберите файл...";
            }
        });  
    }
}
