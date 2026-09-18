import http from "node:http";

function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
) {
    console.log("Method: ", req.method);
    console.log("URL: ", req.url);
    console.log("Headers: ", req.headers);

    res.write("Hello ");
    res.end("World!");
}

const server = http.createServer(handleRequest);

server.listen(3000);