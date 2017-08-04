var constants = require('../constants.js');

function listen(client, socket, chatMessages, sendStatus, payload) {
    var name = payload.name,
    message = payload.message;

    if (constants.whitespacePattern.test(name) || constants.whitespacePattern.test(message)) {
        sendStatus('Name and message is required');
    } else {
        chatMessages.insert({ name: name, message: message }, function () {
            // Emit latest messages
            client.emit('new_chat_message', [payload]);
            sendStatus({ message: 'Message sent', clear: true });
        })
    }
}

module.exports = { listen };