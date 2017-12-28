var mongo = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');
var port = process.env.PORT || 3000;
var app = require('express')();
app.use(express.static('frontend'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/create-channel', function(req, res){
    var roomName = req.body.roomName;

    if(!roomList.find(function(s){return s == roomName})){
        res.send(roomName);
        roomList.push(roomName);
    }else{
        res.send('Already exists.');
    }
    console.log(roomList);
});

var httpServer = require('http').createServer(app);

// Only one room, so keeping the host here
var clientIdList = [];
var videoRequestList = [];
var currentVideoUrl = 'yIDa8sIWeW0'; // default video
var hostYTPlayerStatus;
var videoHostId;
var videoHostTime;
var roomList = [];

exports.clientIdList = clientIdList;
exports.videoRequestList = videoRequestList;
exports.currentVideoUrl = currentVideoUrl;
exports.hostYTPlayerStatus = hostYTPlayerStatus;
exports.videoHostId = videoHostId;
exports.videoHostTime = videoHostTime;
exports.roomList = roomList;

// Server settings
httpServer.listen(port);

// Connect to mongodb and respond to client events
mongo.connect(require('./constants').mongodbAddress, function (error, db) {
    if (error) throw error;
    // Establish socket listener
    var client = require('./sockets.js').listen(httpServer, db);
});

console.log("Server running at http://localhost:%d", port);
