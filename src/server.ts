import http from "node:http";

function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
) {
    const url = new URL(req.url!, "http://localhost:3000");

    console.log("URL: ", url);
    console.log("Pathname: ", url.pathname);
    console.log("Name: ", url.searchParams);

    if (req.method === "GET" && url.pathname === "/") {
        res.end("Home");
    }
    else if (req.method === "GET" && url.pathname === "/hello") {
        const name = url.searchParams.get("name");
        
        if (name !== null) {
            res.end(`Hello ${name}!`);
        }
        else {
            res.end("Hello, World!");
        }
    }
    else if (req.method === "POST" && url.pathname === "/echo") {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const parsedBody = JSON.parse(body);

            console.log(parsedBody);
            console.log(parsedBody.message);

            res.end(parsedBody.message);
        });
    }
    else {
        res.statusCode = 404;
        res.end("Not found");
    }
}

const server = http.createServer(handleRequest);

server.listen(3000);