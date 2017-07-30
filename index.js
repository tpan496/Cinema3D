var mongo = require('mongodb').MongoClient;
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var address = 'mongodb://tpan496:trollNoob971006!@exp-server-shard-00-00-8ecae.mongodb.net:27017,exp-server-shard-00-01-8ecae.mongodb.net:27017,exp-server-shard-00-02-8ecae.mongodb.net:27017/exp-server?ssl=true&replicaSet=exp-server-shard-0&authSource=admin'

var http = require('http'),
    fs = require('fs'),
    // NEVER use a Sync function except at start-up!
    index = fs.readFileSync(__dirname + '/index.html');

// Send index.html to all requests
var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

var client = require('socket.io').listen(app);

mongo.connect(address, function (error, db) {
    if (error) throw error;
    client.on('connection', function (socket) {

        var collection = db.collection('messages'),
            sendStatus = function(s){
                socket.emit('status', s);
            };

        // Emit all messages
        collection.find().limit(100).sort({_id: 1}).toArray(function(error, result){
            if(error) throw error;
            socket.emit('output', result);
        })

        socket.on('input', function (payload) {
            var name = payload.name,
                message = payload.message,
                whitespacePattern = /^\s*$/;

            if (whitespacePattern.test(name) || whitespacePattern.test(message)) {
                sendStatus('Name and message is required');
            } else {
                collection.insert({ name: name, message: message }, function () {
                    // Emit latest messages
                    client.emit('output', [payload]);
                    sendStatus({message: 'Message sent', clear: true});
                })
            }
        });
    })
});

app.listen(port);
console.log("Server running at http://localhost:%d", port);
