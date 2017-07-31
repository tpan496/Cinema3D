var mongo = require('mongodb').MongoClient;
var express = require('express');
var app = require('express')();
var server = require('http').createServer(app);
var port = process.env.PORT || 8080;
var mongodbAddress = 'mongodb://tpan496:trollNoob971006!@exp-server-shard-00-00-8ecae.mongodb.net:27017,exp-server-shard-00-01-8ecae.mongodb.net:27017,exp-server-shard-00-02-8ecae.mongodb.net:27017/exp-server?ssl=true&replicaSet=exp-server-shard-0&authSource=admin'

// Consts
const forceSyncThreshold = 3; // synchronize check frequency
const whitespacePattern = /^\s*$/;

// Only one room, so keeping the host here
var clientIdList = [];
var videoHostId;
var videoHostTime;

// Server settings
var socket = require('socket.io')({
  transports  : [ 'websocket' ]
});
server.listen(port);
app.use(express.static(__dirname));

// Establish socket listener
var client = socket.listen(server);

// Connect to mongodb and respond to client events
mongo.connect(mongodbAddress, function (error, db) {
    if (error) throw error;
    client.on('connection', function (socket) {
        console.log('New client: ' + socket.id);
        clientIdList.push(socket.id);

        // Get chat history and video playlist from database
        var chatMessages = db.collection('chat_messages'),
            playlistUrls = db.collection('playlist_urls'),
            sendStatus = function (s) {
                socket.emit('status', s);
            };

        // Display history messages in chat screen
        chatMessages.find().limit(100).sort({ _id: 1 }).toArray(function (error, result) {
            if (error) throw error;
            console.log(result);
            socket.emit('new_chat_message', result);
        });

        // Listen for new chat message
        socket.on('user_chat_message', function (payload) {
            var name = payload.name,
                message = payload.message,

            if (whitespacePattern.test(name) || whitespacePattern.test(message)) {
                sendStatus('Name and message is required');
            } else {
                chatMessages.insert({ name: name, message: message }, function () {
                    // Emit latest messages
                    client.emit('new_chat_message', [payload]);
                    sendStatus({ message: 'Message sent', clear: true });
                })
            }
        });

        // Listen for new video url
        socket.on('user_video_url', function (payload) {
            var name = payload.name,
                url = payload.url,

            if (whitespacePattern.test(name) || whitespacePattern.test(url)) {
                sendStatus('Valid url is required');
            } else {
                playlistUrls.insert({ url: url }, function () {
                    // Start new video and throw url into playlist
                    client.emit('new_video_url', [payload]);
                    videoHostId = socket.id;
                    client.emit('new_video_id', { id: url });
                    console.log(url);
                    sendStatus({ message: 'Url sent', clear: true });
                });
            }
        });

        // Listen for youtube player status
        var testVideoId = 'M7lc1UVf-VE';
        socket.on('user_youtube_player_status', function (payload) {
            if (payload.status == 1) {
                if (videoHostId == null) {
                    console.log('Host appeared: ' + socket.id);
                    videoHostId = socket.id;
                }
                socket.emit('new_video_id', { id: testVideoId });
            } 
        });

        // Listen for video progress and force sync if necessary
        socket.on('user_video_progress', function (payload) {
            var time = payload.time;
            if (socket.id === videoHostId) {
                videoHostTime = time;
                console.log('Host progress: ' + time);
            } else {
                if (Math.abs(videoHostTime - time) > forceSyncThreshold) {
                    socket.emit("host_video_progress", {time: videoHostTime});
                }
            }
        }); 

        // Request to be host
        socket.on('user_host_request', function(payload){
            videoHostId = socket.id;
        });
    });
});

console.log("Server running at http://localhost:%d", port);
