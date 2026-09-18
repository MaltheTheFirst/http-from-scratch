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
        const contentType = req.headers["content-type"];

        if (contentType === undefined) {
            res.statusCode = 415;
            res.end("Missing content type");
        }
        else {
            const parts = contentType.split(";");
            const mediaType = parts[0];

            if (mediaType !== "application/json") {
                res.statusCode = 415;
                res.end("Unsupported media type");
                return;
            } else {
                let body = "";

                req.on("data", (chunk) => {
                    body += chunk.toString();
                });

                req.on("end", () => {
                    try {
                        const parsedBody = JSON.parse(body);
                        res.end(parsedBody.message);
                    } catch {
                        res.statusCode = 400;
                        res.end("Invalid JSON");
                    }
                });
            }
        }
    }
    else {
        res.statusCode = 404;
        res.end("Not Found");
    }
}

const server = http.createServer(handleRequest);

server.listen(3000);