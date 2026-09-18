import http from "node:http";

function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
) {
    res.write("Hello ");
    res.end("World!");
}

const server = http.createServer(handleRequest);

server.listen(3000);