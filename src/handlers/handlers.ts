import type { Route, RouteHandler } from "../router/router.js";
import { readBody } from "../http/read-body.js"
import { isRecord } from "../server.js"
import { sendJson } from "../http/send-json.js"
import { parseCookies } from "../http/parse-cookies.js"
import { 
    createSession,
    getSession
} from "../sessions/session-store.js"

export const handleHome: RouteHandler = async (req, res, params, url) => {
    res.end("Home");
}

export const handleUser: RouteHandler = async (req, res, params, url) => {
    const userId = params.userId;
    res.end(`User ID: ${userId}`);
}

export const handleUserPost: RouteHandler = async (req, res, params, url) => {
    const userId = params.userId;
    const postId = params.postId;
    res.end(`User ID: ${userId}, Post ID: ${postId}`);
}

export const handleHello: RouteHandler = async (req, res, params, url) => {
    const name = url.searchParams.get("name");
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.session;
    const session = getSession(sessionId);

    let message: string;

    if (name !== null && name.length >= 1) {
        message = `Hello ${name}!`;
    }
    else if (session !== undefined) {
        message = `Hello ${session.username}!`;
    } else {
        message = "Hello, World!";
    }

    const data = {
        message
    };

    sendJson(res, data);
}

export const handleEcho: RouteHandler = async (req, res, params, url) => {
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

export const handleLogin: RouteHandler = async (req, res, params, url) => {
    const body = await readBody(req);
    let parsedBody: unknown;

    try {
        parsedBody = JSON.parse(body);
    }
    catch {
        res.statusCode = 400;
        sendJson(res, { error: "Invalid JSON" });
        return;
    }

    if (!isRecord(parsedBody)) {
        res.statusCode = 400;
        sendJson(res, { error: "Invalid request body: expected an object" });
        return;
    }

    if (typeof parsedBody.username !== "string" || parsedBody.username === "") {
        res.statusCode = 400;
        sendJson(res, { error: "Invalid request body: username must be a non-empty string" });
        return;
    }

    const sessionId = createSession(parsedBody.username);
    res.setHeader(
        "Set-Cookie", 
        `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`
    );
    sendJson(res, { message: "Logged in" });
}