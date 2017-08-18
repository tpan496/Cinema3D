var server = require('../server.js');
var constants = require('../constants.js');

function listen(client, socket, sendStatus, payload) {
    var name = payload.name,
    command = payload.command;

    var sendScreenEmoji = function(s, message){
        client.emit(s, 1);
        sendStatus({ message: message, clear: true });
    };

    if(command == ":popcorn"){
        sendScreenEmoji('popcorn', 'Pop!');
        return;
    }

    if(command == ":pogchamp"){
        sendScreenEmoji('pogchamp', 'Pogchamp!');
        return;
    }

    if(command == ":huaji"){
        sendScreenEmoji('huaji', ':)');
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