import http from "node:http";

function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
) {
    const url = new URL(req.url!, "http://localhost:3000");

    console.log("URL: ", url);
    console.log("Pathname: ", url.pathname);
    console.log("Name: ", url.searchParams);

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