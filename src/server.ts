import http from "node:http";

function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
) {
    if (req.method === "GET" && req.url === "/") {
        res.end("Home");
    }
    else if (req.method === "GET" && req.url === "/hello") {
        res.write("Hello ");
        res.end("World");
    }
    else {
        res.statusCode = 404;
        res.end("Not found");
    }
}

const server = http.createServer(handleRequest);

server.listen(3000);