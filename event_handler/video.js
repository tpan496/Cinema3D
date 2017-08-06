var server = require('../server.js');

function listenHostRequest(client, socket, payload) {
    server.videoHostId = socket.id;
    client.emit("host_video_progress", { time: payload.time, status: payload.status, hostId: server.videoHostId });
}

function listenSkipRequest(client, socket, payload) {
	if (socket.id === server.videoHostId) {
        if (server.videoRequestList.length > 0) {
            var request = server.videoRequestList.shift();
            server.currentVideoUrl = request.command;
            client.emit('new_video_id', { name: request.name, id: server.currentVideoUrl });
        }
    }
}

module.exports = { listenHostRequest, listenSkipRequest };