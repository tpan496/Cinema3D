var server = require('../server.js');
var constants = require('../constants.js');

function listen(client, chatMessages, payload) {
    var name = payload.name,
        message = payload.message;

    if (constants.whitespacePattern.test(name) || constants.whitespacePattern.test(message)) {
        server.sendStatus('Name and message is required');
    } else {
        chatMessages.insert({ name: name, message: message }, function () {
            // Emit latest messages
            client.emit('new_chat_message', [payload]);
            server.sendStatus({ message: 'Message sent', clear: true });
        })
    }
}

module.exports = { listen };