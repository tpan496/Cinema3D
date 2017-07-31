var mongo = require('mongodb').MongoClient;
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var port = process.env.PORT || 8080;
var mongodbAddress = 'mongodb://tpan496:trollNoob971006!@exp-server-shard-00-00-8ecae.mongodb.net:27017,exp-server-shard-00-01-8ecae.mongodb.net:27017,exp-server-shard-00-02-8ecae.mongodb.net:27017/exp-server?ssl=true&replicaSet=exp-server-shard-0&authSource=admin'

var videoHostId;
var videoHostTime;
var forceUpdateThreshold = 1;

server.listen(port);
app.use(express.static(__dirname));

var client = require('socket.io').listen(server);

mongo.connect(mongodbAddress, function (error, db) {
    if (error) throw error;
    client.on('connection', function (socket) {
        console.log('client: ' + socket.id);

        var chatMessages = db.collection('chat_messages'),
            playlistUrls = db.collection('playlist_urls'),
            sendStatus = function (s) {
                socket.emit('status', s);
            };

        // Emit all messages
        chatMessages.find().limit(100).sort({ _id: 1 }).toArray(function (error, result) {
            if (error) throw error;
            console.log(result);
            socket.emit('output_chat_message', result);
        });

        socket.on('input_chat_message', function (payload) {
            var name = payload.name,
                message = payload.message,
                whitespacePattern = /^\s*$/;

            if (whitespacePattern.test(name) || whitespacePattern.test(message)) {
                sendStatus('Name and message is required');
            } else {
                chatMessages.insert({ name: name, message: message }, function () {
                    // Emit latest messages
                    client.emit('output_chat_message', [payload]);
                    sendStatus({ message: 'Message sent', clear: true });
                })
            }
        });

        socket.on('input_video_url', function (payload) {
            var name = payload.name,
                url = payload.url
            whitespacePattern = /^\s*$/;

            if (whitespacePattern.test(name) || whitespacePattern.test(url)) {
                sendStatus('Valid url is required');
            } else {
                playlistUrls.insert({ url: url }, function () {
                    // Emit latest messages
                    client.emit('output_video_url', [payload]);
                    sendStatus({ message: 'Message sent', clear: true });
                });
            }
        });

        var testVideoId = 'M7lc1UVf-VE';
        socket.on('input_player_status', function (payload) {
            console.log('status');
            var status = payload.status;

            if (status == 1) {
                if (videoHostId == null) {
                    console.log('host appeared: ' + socket.id);
                    videoHostId = socket.id;
                }
                socket.emit('output_video_id', { id: testVideoId });
            } 
        });

        socket.on('input_video_progress', function (payload) {
            console.log('progress');
            var time = payload.time;
            if (socket.id === videoHostId) {
                videoHostTime = time;
                console.log('host progress: ' + time);
            } else {
                if (Math.abs(videoHostTime - time) > forceUpdateThreshold) {
                    socket.emit("output_video_progress", {time: videoHostTime});
                }
            }
        }); 
    })
});

console.log("Server running at http://localhost:%d", port);
