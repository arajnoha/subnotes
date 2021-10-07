const loop = document.querySelector("#loop");
const area = document.querySelector("#single");

let data = {};
let context = false;
let password;
let currentName;
let nameFilter;
let contextFilter;
let areaBuffer;

function populateLoop(data, context) {
    // get all records
    const rows = data.entries;

    // filter only the ones inside called folder/root
    let root = rows.filter(function(row) {
        return row.hasParent === context;
    });

    // clean the loop
    loop.innerHTML = "";

    // insert go-up button
    if (context !== false) {
        const li = document.createElement("li");
        const parent = rows.find(object => object.name === context);
        li.textContent = "↩";
        li.dataset.go = parent.hasParent;
        li.className = "folder go-back";
        loop.appendChild(li);
        document.querySelector("#delete-folder").classList.remove("hidden");
    } else {
        document.querySelector("#delete-folder").classList.add("hidden");
    }

    // fill the loop
    for (let i = 0; i < root.length; i++) {
        const li = document.createElement("li");
            li.textContent = root[i].name;
            if (root[i].isParent === true) {
                li.className = "folder";
                li.dataset.go = root[i].name;
            } else {
                li.className = "file";
            }
            loop.appendChild(li);
    }
}

function saveAndRedraw(entry) {
    if (entry) {
        data.entries.push(entry);
    }
    let source = "data/save.php";
    let request = new XMLHttpRequest();
    let package = JSON.stringify(data);
    package = CryptoJS.AES.encrypt(package, password).toString();
    request.open("POST", source, true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.send(package);

    request.onload = function() {
        let recieved = CryptoJS.AES.decrypt(request.response, password).toString(CryptoJS.enc.Utf8);
        populateLoop(JSON.parse(recieved), context);
    }
}

function washingMachine(password, rounds) {

    let result = password;
    while(rounds--) {
        result = CryptoJS.SHA256(result + rounds);
    }
    return result.toString();
}

area.addEventListener("keyup", function(e) {
    if (area.value !== areaBuffer) {
        document.querySelector("#save-note").classList.remove("hidden");
    } else {
        document.querySelector("#save-note").classList.add("hidden");
    }
});

document.addEventListener("click", function(e) {

      if (e.target.id === "login") {
        e.preventDefault();

        // get password, hash him well and clear the DOM input of it
        let passwordFromInput = document.querySelector("#password").value;
        let hash = washingMachine(passwordFromInput, 1000);
        password = washingMachine(passwordFromInput, 100);
        document.querySelector("#password").value = "";

        // verify password
        let verify = new XMLHttpRequest();
        verify.open("POST", "data/auth.php", true);
        verify.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        verify.send("hash="+hash);

        verify.onload = function() {
            // if password matches, request data with the password
            if (verify.response === "1") {

                // display UI
                document.querySelectorAll("section.old")[0].classList.toggle("hidden");
                document.querySelectorAll("section.new")[0].classList.toggle("hidden");

                // requesting raw json
                let source = "data/vault";
                let request = new XMLHttpRequest();
                request.open("GET", source);
                request.responseType = "text";
                request.send();

                // processing the data form json
                request.onload = function() {
                    data = request.response;
                    //decrypt raw data before parsing it as objects
                    decrypted = CryptoJS.AES.decrypt(data, password).toString(CryptoJS.enc.Utf8);
                    if (!decrypted) {console.log(1)}
                    data = JSON.parse(decrypted);
                    populateLoop(data, false);
                }
            // if the vault file is missing
            } else if (verify.response === "2") {
                    if(confirm("The vault file is missing. Do you want to create a new one?")) {
                        data.entries = [];
                        let fresh = {
                            name: "Default note",
                            hasParent: false,
                            isParent: false,
                            content: ""
                        };
                        saveAndRedraw(fresh);
                    }
            // if this is the first install (no hash file yet)
            } else if (verify.response === "3") {
                data.entries = [];
                let fresh = {
                    name: "Default note",
                    hasParent: false,
                    isParent: false,
                    content: ""
                };
                saveAndRedraw(fresh);
            }

        }
    }
    if (e.target.closest("#loop > li")) {
        if (e.target.classList.contains("folder")) {
            context = (e.target.dataset.go === "false") ? false : e.target.dataset.go;
            populateLoop(data, context);
        }
        if (e.target.classList.contains("file")) {
            // display UI
            document.querySelectorAll("section.old")[0].classList.toggle("hidden");
            document.querySelectorAll("section.detail")[0].classList.toggle("hidden");
            currentName = e.target.textContent;
            // specify which note it is based on context (parent folder)
            nameFilter = data.entries.filter(object => object.name === currentName);
            contextFilter = nameFilter.find(object => object.hasParent === context);
            area.value = contextFilter.content;
            // save loaded content to buffer and compare it on keyup to show save button
            areaBuffer = area.value;
            area.focus();
        }
    }
    if (e.target.id === "go-back") {
        document.querySelectorAll("section.old")[0].classList.toggle("hidden");
        document.querySelectorAll("section.detail")[0].classList.toggle("hidden");
    }
    if (e.target.id === "save-note") {
        contextFilter.content = area.value;
        // save but stay in note (redraw currently hidden listing)
        saveAndRedraw();
        document.querySelector("#save-note").classList.add("hidden");
    }
    if (e.target.id === "rename-note") {
        let newName = prompt("Type in new name of this note '"+contextFilter.name+"':");
        if (newName) {
            contextFilter.name = newName;
            saveAndRedraw();
            document.querySelectorAll("section.old")[0].classList.toggle("hidden");
            document.querySelectorAll("section.detail")[0].classList.toggle("hidden");
        }
    }
    if (e.target.id === "delete-note") {
        if (confirm("Do you really want to delete '"+contextFilter.name+"'?")) {
            let index = data.entries.indexOf(contextFilter);
            data.entries.splice(index, 1);
            saveAndRedraw();
            document.querySelectorAll("section.old")[0].classList.toggle("hidden");
            document.querySelectorAll("section.detail")[0].classList.toggle("hidden");
        }
    }
    if (e.target.id === "delete-folder") {
        if (confirm("Do you really want to delete '"+context+"'?")) {
            // find deepest elements
            // traverse the deleation up to context folder
            // redraw loop
        }
    }
    if (e.target.id === "logout") {
        window.location.href = "";
    }
    if (e.target.id === "add-note") {
        let newName = prompt("Name of your new note:");
        if (newName) {
            // create new entry in the "entries" array of objects
            let entry = {
                name: newName,
                hasParent: context,
                isParent: false,
                content: ""
            };

            // push to said array, redraw page and save to the vault
            saveAndRedraw(entry);
        }
    }
    if (e.target.id === "add-folder") {
        let newName = prompt("Name of your new folder:");
        if (newName) {
            // create new entry in the "entries" array of objects
            let entry = {
                name: newName,
                hasParent: context,
                isParent: true
            };

            // push to said array, redraw page and save to the vault
            saveAndRedraw(entry);
        }
    }

});