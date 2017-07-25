var http = require('http');

function onRequest (request, response) {
	console.log('A user made a request' + request.url);
	response.writeHead(200, {"Context-Type": "text/plain"});
	response.write("Qsy is gay");
	response.end();
}
http.createServer(onRequest).listen(process.env.PORT || 8080);
