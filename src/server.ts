import http from "node:http";
import { readBody } from "./http/read-body.js"

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

        if (patternPart.startsWith(":")) {
            const paramName = patternPart.slice(1);

            if (pathPart.length === 0 || paramName.length === 0) {
                return null;
            }

            params[paramName] = pathPart;
            continue;
        } 
        if (patternPart !== pathPart) {
            return null;
        }
    }
    return params;
}

type RouteHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    params: Record<string, string>,
    url: URL
) => void | Promise<void>;

type Route = {
    method: string,
    pattern: string,
    handler: RouteHandler
};

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

type MiddleWare = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: () => Promise<void>
) => Promise<void>;

const logger: MiddleWare = async (req, res, next) => {
    console.log(req.method, req.url);
    await next();
};

const timer: MiddleWare = async (req, res, next) => {
    const start = performance.now();

    await next();

    const duration = performance.now() - start;
    console.log(duration.toFixed(2));
};

const middlewares: MiddleWare[] = [
    logger,
    timer
];

async function runMiddleware(
    req: http.IncomingMessage,
    res: http.ServerResponse
) {
    let index = 0;

    async function next(): Promise<void> {
        const middleware = middlewares[index];
        index++;

        if (middleware === undefined) {
            await handleRequest(req, res);
            return;
        }

        await middleware(req, res, next);
    }

    await next();
}

async function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse
) {
    // Parse the incoming request target into its pathname and query parameters.
    const url = new URL(req.url!, "http://localhost:3000");
    const allowedMethods: string[] = [];

    for (let i = 0; i < routes.length; i++) {
        const route = routes[i];

        const match = matchRoute(route.pattern, url.pathname);
        if (match === null) {
            continue;
        }

        if (route.method === "GET") {
            allowedMethods.push("GET", "HEAD");
        } else {
        allowedMethods.push(route.method);
        }

        if (req.method !== route.method &&
            !(req.method === "HEAD" && route.method === "GET")
        ) {
            continue;
        }

        try {
        await route.handler(req, res, match, url);
        return;
        } catch (error) {
            console.error("Route handler failed", error);

            res.statusCode = 500;
            res.end("Internal server error");
            return;
        }
    }

    if (req.method === "OPTIONS" && allowedMethods.length !== 0) {
        allowedMethods.push("OPTIONS");
        res.setHeader("Allow", allowedMethods.join(", "));
        res.statusCode = 204;
        res.end();
        return;
    }

    if (allowedMethods.length === 0) {
    // No method/path combination above matched the request.
    res.statusCode = 404;
    res.end("Not Found");
    return;
    }

    res.statusCode = 405;
    res.setHeader("Allow", allowedMethods.join(", "));
    res.end("Method Not Allowed");
}

const server = http.createServer((req, res) => {
    runMiddleware(req, res).catch((error) => {
        return handleRequest(req, res).catch((error) => {
            console.error("Unhandled request error:", error);

            if (!res.headersSent) {
                res.statusCode = 500;
                res.end("Internal Server Error");
                return;
            }

            res.destroy(error);
        });
    });
});

server.listen(3000);