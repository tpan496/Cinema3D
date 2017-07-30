var http = require('http');
var mongo = require('mongodb').MongoClient;
var client = require('socket.io').listen(8080).sockets;

mongo.connect('mongodb://127.0.0.1/chat', function (error, db) {
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

var server = http.createServer(function (request, response) {

    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Qsy is gay");

});

var port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);
