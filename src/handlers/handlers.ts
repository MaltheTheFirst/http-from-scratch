import type { 
    Route, 
    RouteHandler,
    AuthenticatedRouteHandler,
} from "../router/router.js";
import { readBody } from "../http/read-body.js"
import { isRecord } from "../server.js"
import { sendJson } from "../http/send-json.js"
import { readJsonBody } from "../http/read-json-body.js"
import { parseCookies } from "../http/parse-cookies.js"
import { 
    createSession,
    getSession,
    deleteSession,
} from "../sessions/session-store.js"
import { db } from "../db/database.js"
import { serveStaticFile } from "../http/serve-static-file.js"

export const handleHome: RouteHandler = async (req, res, params, url) => {
    res.end("Home");
}

export const handleUser: RouteHandler = async (req, res, params, url) => {
    const userId = Number(params.userId);

    if(Number.isNaN(userId)) {
        res.statusCode = 400;
        sendJson(res, { error: "Invalid user ID" });
        return;
    }

    const result = await db.query(`
        SELECT id, username
        FROM users
        WHERE id = $1;
    `,
        [userId]
    );

    const foundUser = result.rows[0];

    if (foundUser === undefined) {
        res.statusCode = 404;
        sendJson(res, { error: "User not found" });
        return;
    }

    sendJson(res, foundUser);
}

export const handleUsers: RouteHandler = async (req, res, params, url) => {
    const result = await db.query(`
        SELECT id, username
        FROM users;
    `
    );

    sendJson(res, result.rows);
};

export const handleUserPost: RouteHandler = async (req, res, params, url) => {
    const userId = params.userId;
    const postId = params.postId;
    res.end(`User ID: ${userId}, Post ID: ${postId}`);
}

export const handleHello: RouteHandler = async (req, res, params, url, context) => {
    const name = url.searchParams.get("name");

    let message: string;

    if (name !== null && name.length >= 1) {
        message = `Hello ${name}!`;
    }
    else if (context.session !== undefined) {
        message = `Hello ${context.session.username}!`;
    } else {
        message = "Hello, World!";
    }

    const data = {
        message
    };

    sendJson(res, data);
}

export const handleEcho: RouteHandler = async (req, res, params, url) => {
    // Read and parse the JSON request body.
    const result = await readJsonBody(req);

    if (!result.ok) {
        res.statusCode = result.statusCode;
        sendJson(res, { error: result.error });
        return;
    }

    const parsedBody = result.data;

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

export const handleLogout: RouteHandler = async (req, res, params, url) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.session;

    if (sessionId !== undefined) {
        deleteSession(sessionId);
    }

    res.setHeader(
        "Set-Cookie", 
        `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    sendJson(res, { message: "Logged out" });
}

export const handleProfile: AuthenticatedRouteHandler = async (req, res, params, url, context) => {

    const username = context.session.username;
    sendJson(res, { username });
}

export const handleCreateUser: RouteHandler = async (req, res, params, url, context) => {
    const result = await readJsonBody(req);

    if (!result.ok) {
        res.statusCode = result.statusCode;
        sendJson(res, { error: result.error });
        return;
    }

    const parsedBody = result.data;

    if (!isRecord(parsedBody)) {
        res.statusCode = 400;
        res.end("Invalid request body: expected an object");
        return;
    }

    if (!Object.hasOwn(parsedBody, "username")) {
        res.statusCode = 400;
        res.end("Invalid request body: 'username' property is required");
        return;
    }
    if (typeof parsedBody.username !== "string") {
        res.statusCode = 400;
        res.end("Invalid request body: 'username' must be a string");
        return;
    }

    if (parsedBody.username.length === 0) {
        res.statusCode = 400;
        sendJson(res, { error: "Invalid request body: 'username' must not be empty" });
        return;
    }

    const username = parsedBody.username;

    try {
        const dbResult = await db.query(`
        INSERT INTO users (username)
        VALUES ($1)
        RETURNING id, username;
    `,
        [username]
    );

        const createdUser = dbResult.rows[0];
        res.statusCode = 201;
        sendJson(res, createdUser);
    } catch (error) {
        if (isRecord(error) && error.code === "23505" && error.constraint === "users_username_key") {
            res.statusCode = 409;
            sendJson(res, { error: "Username already exists" });
            return;
        }
        res.statusCode = 500;
        sendJson(res, { error: "Internal server error" });
    }
};

export const handleIndex: RouteHandler = async (req, res, params, url, context) => {
    await serveStaticFile(res, "public/index.html", "text/html; charset=utf-8")
};

export const handleAppJs: RouteHandler = async (req, res, params, url, context) => {
    await serveStaticFile(res, "public/app.js", "application/javascript; charset=utf-8")
}