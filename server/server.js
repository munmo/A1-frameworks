var express = require('express'); //Used for routing 
var app = express();
var http = require('http').Server(app); //Used to provide http functionality 
var cors = require('cors');
var path = require('path');
app.use(cors());

app.use(express.json()); // Parse JSON request bodies

let server = http.listen(4200, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Server listening on port: " + port);
});

app.post('/api/auth', require('./routes/login'));
