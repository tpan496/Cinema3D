var server = require('../server.js');
var constants = require('../constants.js');

function listen(client, socket, sendStatus, payload) {
    var name = payload.name,
    command = payload.command;
    if(command == ":popcorn"){
        client.emit('popcorn', 1);
        sendStatus({ message: 'Pop!', clear: true });
        return;
    }

    if(command == ":pogchamp"){
        client.emit('pogchamp', 1);
        sendStatus({ message: 'Pogchamp!', clear: true });
        return;
    }

    if(command == ":huaji"){
        client.emit('huaji', 1);
        sendStatus({ message: ':)', clear: true });
        return;
    }

    if (constants.whitespacePattern.test(name) || constants.whitespacePattern.test(command)) {
        sendStatus('Valid url is required');
    } else {

           // Throw url into playlist
           client.emit('new_video_url', [payload]);
           server.videoRequestList.push({ name: name, command: command })
           // If no video is playing now
           if (server.hostYTPlayerStatus == constants.YT_VIDEO_ENDED) {
               server.videoRequestList.shift();
               server.currentVideoUrl = command;
               client.emit('new_video_id', { name: name, id: server.currentVideoUrl });
               server.hostYTPlayerStatus = 0;
           }
           console.log(command);
           sendStatus({ message: 'Command sent', clear: true });
    }
}

module.exports = { listen };