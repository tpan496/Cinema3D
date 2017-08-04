var server = require('../server.js');
var constants = require('../constants.js');

function listenStatus(socket, payload) {
    if (payload.status == 1) {
        if (server.videoHostId == null) {
            console.log('Host appeared: ' + socket.id);
            server.videoHostId = socket.id;
            socket.emit("host_youtube_video_progress", { time: server.videoHostTime, status: server.hostYTPlayerStatus, hostId: server.videoHostId });
        }
        socket.emit('new_video_id', { id: server.currentVideoUrl });
    }
}

function listenProgress(client, socket, payload){
	var time = payload.time;
    var status = payload.status;
    if (socket.id === server.videoHostId) {
        server.videoHostTime = time;
        switch (status) {
            case constants.YT_VIDEO_ENDED:
                if (server.videoRequestList.length > 0) {
                    var request = server.videoRequestList.shift();
                    server.currentVideoUrl = request.url;
                    client.emit('new_video_id', { name: request.name, id: server.currentVideoUrl });
                }
                break;
            case constants.YT_VIDEO_PLAYING:
                if (server.hostYTPlayerStatus !== status) {
                    client.emit("host_youtube_video_progress", { time: server.videoHostTime, status: constants.YT_VIDEO_PLAYING, hostId: server.videoHostId });
                }
                break;
            case constants.YT_VIDEO_PAUSED: client.emit("host_youtube_video_progress", { time: server.videoHostTime, status: constants.YT_VIDEO_PAUSED, hostId: server.videoHostId }); break;
            default: break;
        }
        server.hostYTPlayerStatus = status;
        console.log('Host progress: ' + time);
    } else {
        if (status !== server.hostYTPlayerStatus) {
            socket.emit("host_youtube_video_progress", { time: server.videoHostTime, status: server.hostYTPlayerStatus, hostId: server.videoHostId });
        }
        else if (Math.abs(server.videoHostTime - time) > constants.forceSyncThreshold) {
            socket.emit("host_youtube_video_progress", { time: server.videoHostTime, status: status, hostId: server.videoHostId });
        }
    }
}

module.exports = { listenStatus, listenProgress };