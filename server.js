var mongo = require('mongodb').MongoClient;
var express = require('express');
var app = require('express')();
var httpServer = require('http').createServer(app);
var port = process.env.PORT || 8080;

// Only one room, so keeping the host here
var clientIdList = [];
var videoRequestList = [];
var currentVideoUrl = 'VtI5HM7GVGY'; // default video
var hostYTPlayerStatus;
var videoHostId;
var videoHostTime;

exports.clientIdList = clientIdList;
exports.videoRequestList = videoRequestList;
exports.currentVideoUrl = currentVideoUrl;
exports.hostYTPlayerStatus = hostYTPlayerStatus;
exports.videoHostId = videoHostId;
exports.videoHostTime = videoHostTime;

// Server settings
httpServer.listen(port);
app.use(express.static('frontend'));

// Connect to mongodb and respond to client events
mongo.connect(require('./constants').mongodbAddress, function (error, db) {
    if (error) throw error;
    // Establish socket listener
    var client = require('./sockets.js').listen(httpServer, db);
});

console.log("Server running at http://localhost:%d", port);
