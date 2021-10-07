# subnotes
Simple, secure, encrypted, zero-knowledge note-taking application.
Key features:
- **no database** - everything is stored in a single encrypted vault file on a server
- **no metadata** - as the folder structure is faux and recreated from an array of objects in javascript, there are absolutely no data stored, nor exposed on transmission
- **password never touches the server** - even for the authentication, raw password is washed in hundreds salted rounds, one output is checked against the server, the other separate output is used to decrypt the vault
- **tamper-proof** - no need to trust even your neighbour, as no sensitive data leaves the client, you can let a friend install subnotes on their server for you and then compare
 checksum of javascript files loaded in your browser from said server with the ones in this github repo. This way, security is guaranteed regardless of location

### Install
Simply copy this repository on your PHP server and access its URL from the browser. No plugins required.
You will choose your password on the first opening as it recognises no hash generated on the server.
The installation is very small, but you can go even further and minify the content of data/ if you need.

### TODO
- delete folder - needs object traversing due to faux structure, this will be the very next feature
- rename folder - needs object traversing due to faux structure, this will be the very next feature
- fulltext search - will be simple as the whole vault is loaded and decrypted on the client
- timestamps
- sharing - this will be a bit tricky, shared notes would have to be duplicated from the array of objects and reencrypted in a separate _shared vault_ with a separate password and a viewer to display it

### Get along
Merge requests are welcomed.
Get in touch with me on adam@rajnoha.com for questions, tips and chitchat.