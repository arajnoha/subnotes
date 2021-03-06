const loop = document.querySelector("#loop");
const area = document.querySelector("#single");

let data = {};
let context = false;
let password;
let hash;
let currentName;
let nameFilter;
let contextFilter;
let areaBuffer;
let pastingElement;
let pileUpArr = [];
let yellowMode = false;
let redMode = false;

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
        const parent = rows.find(object => object.id == context);
        li.textContent = "↩";
        li.dataset.id = parent.hasParent;
        li.className = "folder go-back";
        loop.appendChild(li);
        document.querySelector("#delete-folder").classList.remove("hidden");
        document.querySelector("#rename-folder").classList.remove("hidden");
        document.querySelector("#move").classList.remove("hidden");
        document.querySelectorAll(".note-name")[0].textContent = parent.name;
    } else {
        document.querySelector("#delete-folder").classList.add("hidden");
        document.querySelector("#rename-folder").classList.add("hidden");
        document.querySelector("#move").classList.add("hidden");
        document.querySelectorAll(".note-name")[0].textContent = "";
    }

    // fill the loop
    for (let i = 0; i < root.length; i++) {
        const li = document.createElement("li");
            li.textContent = root[i].name;
            li.dataset.id = root[i].id;
            if (root[i].isParent === true) {
                li.className = "folder";
            } else {
                li.className = "file";
            }
            let date = new Date(root[i].id);
            let options = {year: 'numeric', month: 'numeric', day: 'numeric'};
            li.dataset.date = date.toLocaleDateString('cs', options);
            loop.appendChild(li);
    }

    // if in yellow-mode, add pastable note at the bottom of the loop
    if (yellowMode) {
        let pastable = document.createElement("li");
        pastable.textContent = pastingElement.name;
        if (pastingElement.isParent === true) {
            pastable.className = "folder pastable";
        } else {
            pastable.className = "file pastable";
        }

        // hide itself from the loop (so user cannot insert it onto/into itself)
        if (document.querySelectorAll("ul li[data-id='"+pastingElement.id+"']").length > 0) {
            document.querySelectorAll("ul li[data-id='"+pastingElement.id+"']")[0].classList.add("hidden");
        }

        let date = new Date(pastingElement.id);
        let options = {year: 'numeric', month: 'numeric', day: 'numeric'};
        pastable.dataset.date = date.toLocaleDateString('cs', options);
        loop.appendChild(pastable);
    }
}
function populateSearchLoop(string) {
    let contentful = data.entries.filter(obj => obj.content);
    let contentSearch = contentful.filter(obj => obj.content.includes(string));
    let nameSearch = data.entries.filter(obj => obj.name.includes(string));
    let fullSearch = contentSearch.concat(nameSearch.filter((item) => contentSearch.indexOf(item) < 0));
    loop.innerHTML = "";
    document.body.classList.add("red-mode");
    redMode = true;

    for (item of fullSearch) {
        const li = document.createElement("li");
        li.textContent = item.name;
        li.dataset.id = item.id;
        if (item.isParent === true) {
            li.className = "folder";
        } else {
            li.className = "file";
        }
        let date = new Date(item.id);
        let options = {year: 'numeric', month: 'numeric', day: 'numeric'};
        li.dataset.date = date.toLocaleDateString('cs', options);
        loop.appendChild(li);
    }
}
function pileUp(entry) {
    let element = data.entries.find(object => object.id == entry);
    let filter = data.entries.filter(object => object.hasParent == entry);
    pileUpArr.push(data.entries.indexOf(element));
    for (el of filter) {
	pileUp(el.id);
    }
}

function login(password, hash) {
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
                let source = "data/vault?t"+Math.floor(Date.now());
                let request = new XMLHttpRequest();
                request.open("GET", source);
                request.responseType = "text";
                request.send();

                // processing the data form json
                request.onload = function() {
                    data = request.response;
                    //decrypt raw data before parsing it as objects
                    decrypted = CryptoJS.AES.decrypt(data, password).toString(CryptoJS.enc.Utf8);
                    data = JSON.parse(decrypted);
                    populateLoop(data, false);
                }
            // if the vault file is missing
            } else if (verify.response === "2") {
                    if(confirm("The vault file is missing. Do you want to create a new one?")) {
                        data.entries = [];
                        let fresh = {
                            id: Math.floor(Date.now()),
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
                    id: Math.floor(Date.now()),
                    name: "Default note",
                    hasParent: false,
                    isParent: false,
                    content: ""
                };
                saveAndRedraw(fresh);
            }

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
        hash = washingMachine(passwordFromInput, 1000);
        password = washingMachine(passwordFromInput, 100);
        document.querySelector("#password").value = "";

        // perform verification
        login(password, hash);
    }
    if (e.target.closest("#loop > li")) {
        if (redMode) {
            redMode = false;
            document.body.classList.remove("red-mode");
            // re-do context bceause when coming from search,
            // there is no data on the clicked parent folder
            if (e.target.classList.contains("file")) {
                context = data.entries.find(obj => obj.id == e.target.dataset.id).hasParent;
                // populate on background while note detail is
                // opening so back button works correctly
                populateLoop(data, context);
            }
        }

        if (e.target.classList.contains("folder")) {
            context = (e.target.dataset.id === "false") ? false : e.target.dataset.id;
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
            document.querySelectorAll(".detail .note-name")[0].textContent = currentName;
            // save loaded content to buffer and compare it on keyup to show save button
            areaBuffer = area.value;
            area.focus();
        }
    }
    if (e.target.id === "go-back") {
        document.querySelectorAll("section.old")[0].classList.toggle("hidden");
        document.querySelectorAll("section.detail")[0].classList.toggle("hidden");
    }
    if (e.target.id === "move") {
        yellowMode = true;
        document.body.classList.add("yellow-mode");

        // moving the whole current folder
        if (document.querySelectorAll("section.detail")[0].classList.contains("hidden")) {
            pastingElement = data.entries.find(row => row.id == context);
            let showParent;

            // if the moving folder is a direct child of root, show root, otherwise, show parent
            if (pastingElement.hasParent != false) {
                showParent = data.entries.find(row => row.id == pastingElement.hasParent).id;
            } else {
                showParent = false;
            }
            context = showParent;

        // moving just this note
        } else {
            document.querySelectorAll("section.old")[0].classList.toggle("hidden");
            document.querySelectorAll("section.detail")[0].classList.toggle("hidden");
            pastingElement = contextFilter;
        }

        populateLoop(data, context);

    }

    if (e.target.id === "paste") {
        // if moving object is folder
        if (document.querySelectorAll("ul li.pastable")[0].classList.contains("folder")) {
            pastingElement.hasParent = context;
        // or a file
        } else {
            contextFilter.hasParent = context;
        }
        yellowMode = false;
        document.body.classList.remove("yellow-mode");
        saveAndRedraw();
    }
    if (e.target.id === "close-yellow-mode") {
        yellowMode = false;
        document.body.classList.remove("yellow-mode");
        populateLoop(data, context);
    }
    if (e.target.id === "close-red-mode") {
        redMode = false;
        document.body.classList.remove("red-mode");
        populateLoop(data, context);
    }
    if (e.target.id === "save-note") {
        contextFilter.content = area.value;
        // save but stay in note (redraw currently hidden listing)
        saveAndRedraw();
        document.querySelector("#save-note").classList.add("hidden");
    }
    if (e.target.id === "rename-note") {
        let newName = prompt("Type in new name of this note '"+contextFilter.name+"':", contextFilter.name);
        if (newName) {
            contextFilter.name = newName;
            saveAndRedraw();
            document.querySelectorAll("section.old")[0].classList.toggle("hidden");
            document.querySelectorAll("section.detail")[0].classList.toggle("hidden");
        }
    }
    if (e.target.id === "search") {
        let search = prompt("What are you looking for?");
        if (search) {
            populateSearchLoop(search);
        }
    }
    if (e.target.id === "rename-folder") {
        let oldName = data.entries.find(object => object.id == context);
        let newName = prompt("Type in new name of this folder '"+oldName.name+"':", oldName.name);
        if (newName) {
            oldName.name = newName;
            saveAndRedraw();
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
	    let current = data.entries.find(object => object.id == context);
        if (confirm("Do you really want to delete '"+current.name+"'?")) {
            // recursively add all descending children into the array as indexes
            // modify the structure
            // redraw loop
            pileUp(context);
	    while(pileUpArr.length) {
	      data.entries.splice(pileUpArr.pop(), 1);
	    }
	    context = current.hasParent;
            saveAndRedraw();
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
                id: Math.floor(Date.now()),
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
                id: Math.floor(Date.now()),
                name: newName,
                hasParent: context,
                isParent: true
            };

            // push to said array, redraw page and save to the vault
            saveAndRedraw(entry);
        }
    }

});
