import http from "node:http";

function handleRequest(req, res) {
    res.write("Hello ");
    res.end("World!");
}

const server = http.createServer(handleRequest);

server.listen(3000);