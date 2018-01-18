var io = require('socket.io')({
    transports: ['websocket']
});
var server = require('./server.js');

// Handlers
var chat = require('./event_handler/chat.js'),
    command = require('./event_handler/command.js'),
    youtube = require('./event_handler/youtube.js'),
    video = require('./event_handler/video.js');

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

exports.listen = function (httpSever, db) {
    client = io.listen(httpSever);

    client.on('connection', function (socket) {
        console.log('New client: ' + socket.id);

        // New user
        server.clientIdList.push({ id: socket.id, x: 0, y: 5, z: 0, color: getRandomColor() });
        client.emit('new_user', server.clientIdList);
        console.log(server.clientIdList);
        //socket.emit('new_user', server.clientIdList);

        // Get chat history and video playlist from database
        var chatMessages = db.collection('chat_messages'),
            playlistUrls = db.collection('playlist_urls'),
            sendStatus = function (s) {
                socket.emit('status', s);
            };

        // Display history messages to client
        chatMessages.find().skip(chatMessages.count - 100).toArray(function (error, result) {
            if (error) throw error;
            socket.emit('new_chat_message', result);
        });

        // Display playlist to client
        console.log(server.videoRequestList);
        for (var i = 0; i < server.videoRequestList.length; i++) {
            var payload = server.videoRequestList[i];
            socket.emit('new_video_url', [payload]);
        }

        // Listen for new chat message
        socket.on('user_chat_message', function (payload) {
            chat.listen(client, socket, chatMessages, sendStatus, payload);
        });

        // Listen for new video url
        socket.on('user_console_command', function (payload) {
            command.listen(client, socket, sendStatus, payload);
        });

        // Listen for youtube player status
        socket.on('user_youtube_player_status', function (payload) {
            youtube.listenStatus(socket, payload);
        });

        // Listen for youtube video progress and force sync if necessary
        socket.on('user_youtube_video_progress', function (payload) {
            youtube.listenProgress(client, socket, payload);
        });

        // Request to be host
        socket.on('user_host_request', function (payload) {
            video.listenHostRequest(client, socket, payload);
        });

        // Request to skip
        socket.on('user_skip_request', function (payload) {
            video.listenSkipRequest(client, socket, payload);
        });

        // User disconnect
        socket.on('disconnect', function () {
            var index = server.clientIdList.indexOf({ id: socket.id });
            server.clientIdList.splice(index, 1);
            client.emit('user_list_update', server.clientIdList);
            client.emit('user_3d_left', { id: socket.id });
        });

        // Player move
        socket.on('user_3d_position', function (payload) {
            client.emit('user_3d_moved', { id: socket.id, x: payload.x, y: payload.y, z: payload.z })
        });

        // Player throw ball
        socket.on('user_3d_throw_ball', function(payload){
            client.emit('user_3d_throw_ball', { id: socket.id, position: payload.position, shootDirection: payload.shootDirection});
        });
    });

    return client;
}
