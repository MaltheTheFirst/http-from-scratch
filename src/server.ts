
import http from "node:http";

function matchRoute (pattern: string, pathname: string) {
    const patternParts = pattern.split("/");
    const pathParts = pathname.split("/");
    const params: Record<string, string> = {};

    if (patternParts.length !== pathParts.length) {
        return null;
    }
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];

        if (!patternPart.startsWith(":") && patternPart === pathPart) {

        } 
        else if (patternPart.startsWith(":")) {
            const paramParts = patternPart.split(":");
            const paramName = paramParts[1];
            params[paramName] = pathPart;
        }
        else {
            return null;
        }
    }
    return params;
}

const routes = [
    { method: "GET", pattern: "/users/:userId", handler: handleUser },
    { method: "GET", pattern: "/users/:userId/posts/:postId", handler: handleUserPost },
    { method: "GET", pattern: "/hello", handler: handleHello },
    { method: "GET", pattern: "/", handler: handleHome },
    { method: "POST", pattern: "/echo", handler: handleEcho }
];

function handleUser(req: http.IncomingMessage, res: http.ServerResponse, params: Record<string, string>, url: URL) {
    const userId = params.userId;
    res.end(`User ID: ${userId}`);
}

function handleUserPost(req: http.IncomingMessage, res: http.ServerResponse, params: Record<string, string>, url: URL) {
    const userId = params.userId;
    const postId = params.postId;
    res.end(`User ID: ${userId}, Post ID: ${postId}`);
}

function handleHello (req: http.IncomingMessage, res: http.ServerResponse, params: Record<string, string>, url: URL) {
    const name = url.searchParams.get("name");
    if (name !== null && name.length >= 1) {
        res.end(`Hello ${name}!`);
    }
    else {
        res.end("Hello, World!");
    }
}

function handleHome(req: http.IncomingMessage, res: http.ServerResponse, params: Record<string, string>, url: URL) {
    res.end("Home");
}

function handleEcho(req: http.IncomingMessage, res: http.ServerResponse, params: Record<string, string>, url: URL) {
    // Validate the representation before consuming the request body.
    const contentType = req.headers["content-type"];

    if (contentType === undefined) {
        res.statusCode = 415;
        res.end("Missing content type");
        return;
    } else {
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
                    if (typeof parsedBody !== "object" || parsedBody === null || Array.isArray(parsedBody)) {
                        res.statusCode = 400;
                        res.end("Invalid request body: expected an object");
                    } else {

                        if (!Object.hasOwn(parsedBody, "message")) {
                            res.statusCode = 400;
                            res.end("Invalid request body: 'message' property is required");
                        }
                        else if (typeof parsedBody.message !== "string") {
                            res.statusCode = 400;
                            res.end("Invalid request body: 'message' must be a string");
                        } else {
                            res.end(parsedBody.message);
                        }
                    }
                } catch {
                    res.statusCode = 400;
                    res.end("Invalid JSON");
                }
            });           
        }
    }
}

function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
) {
    // Parse the incoming request target into its pathname and query parameters.
    const url = new URL(req.url!, "http://localhost:3000");

    for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        if (req.method !== route.method) {
            continue;
        }

        const match = matchRoute(route.pattern, url.pathname);
        if (match === null) {
            continue;
        }
        route.handler(req, res, match, url);
        return;
    }

    // No method/path combination above matched the request.
    res.statusCode = 404;
    res.end("Not Found");
}

const server = http.createServer(handleRequest);

server.listen(3000);