import http from "node:http";
import { readBody } from "./http/read-body.js"
import { runMiddleware } from "./middleware/middleware.js"
import { handleRequest } from "./router/router.js"
import type { Route } from "./router/router.js"

const routes: Route[] = [
    { method: "GET", pattern: "/users/:userId", handler: handleUser },
    { method: "GET", pattern: "/users/:userId/posts/:postId", handler: handleUserPost },
    { method: "GET", pattern: "/hello", handler: handleHello },
    { method: "GET", pattern: "/", handler: handleHome },
    { method: "POST", pattern: "/echo", handler: handleEcho },
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

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

async function handleEcho(req: http.IncomingMessage, res: http.ServerResponse, params: Record<string, string>, url: URL) {
    // Validate the representation before consuming the request body.
    const contentType = req.headers["content-type"];

    if (contentType === undefined) {
        res.statusCode = 415;
        res.end("Missing content type");
        return;
    }
    const parts = contentType.split(";");
    const mediaType = parts[0];

    if (mediaType !== "application/json") {
        res.statusCode = 415;
        res.end("Unsupported media type");
        return;
    } 
    let body: string;

    try {
        body = await readBody(req);
    } catch {
        res.statusCode = 400;
        res.end("Failed to read request body");
        return;
    }

    try {
        const parsedBody: unknown = JSON.parse(body);

        if (!isRecord(parsedBody)) {
            res.statusCode = 400;
            res.end("Invalid request body: expected an object");
            return;
        }

        if (!Object.hasOwn(parsedBody, "message")) {
            res.statusCode = 400;
            res.end("Invalid request body: 'message' property is required");
            return;
        }
        if (typeof parsedBody.message !== "string") {
            res.statusCode = 400;
            res.end("Invalid request body: 'message' must be a string");
            return;
        }
        res.end(parsedBody.message);
    } catch {
        res.statusCode = 400;
        res.end("Invalid JSON");
    }
}

const server = http.createServer((req, res) => {
    runMiddleware(req, res, async (req, res) => {
        await handleRequest(req, res, routes);
    }).catch((error) => {
        console.error("Unhandled request error:", error);

        if (!res.headersSent) {
            res.statusCode = 500;
            res.end("Internal Server Error");
            return;
        }

        res.destroy(error);
    });
});

server.listen(3000);