
import http from "node:http";

function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
) {
    // Parse the incoming request target into its pathname and query parameters.
    const url = new URL(req.url!, "http://localhost:3000");

    console.log("URL: ", url);
    console.log("Pathname: ", url.pathname);
    console.log("Name: ", url.searchParams);

    // Manually route requests based on HTTP method and pathname.
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
        // Validate the representation before consuming the request body.
        const contentType = req.headers["content-type"];

        if (contentType === undefined) {
            res.statusCode = 415;
            res.end("Missing content type");
        }
        else {
            // Content-Type may contain parameters, e.g. "application/json; charset=utf-8".
            const parts = contentType.split(";");
            const mediaType = parts[0];

            if (mediaType !== "application/json") {
                res.statusCode = 415;
                res.end("Unsupported media type");
                return;
            } else {
                let body = "";

                // IncomingMessage is a readable stream. Body data may arrive in multiple chunks, so accumulate them until the stream ends.
                req.on("data", (chunk) => {
                    body += chunk.toString();
                });

                req.on("end", () => {

                    // JSON.parse converts the complete JSON text into a JavaScript value and throws if the JSON is malformed.
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
        // No method/path combination above matched the request.
        res.statusCode = 404;
        res.end("Not Found");
    }
}

const server = http.createServer(handleRequest);

server.listen(3000);