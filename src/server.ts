import http from "node:http";
import { runMiddleware } from "./middleware/middleware.js"
import { handleRequest } from "./router/router.js"
import type { Route } from "./router/router.js"
import {
    handleHome,
    handleHello,
    handleUser,
    handleUserPost,
    handleEcho,
    handleLogin,
    handleLogout,
} from "./handlers/handlers.js"
import type { RequestContext } from "./http/request-context.js"

const routes: Route[] = [
    { method: "GET", pattern: "/users/:userId", handler: handleUser },
    { method: "GET", pattern: "/users/:userId/posts/:postId", handler: handleUserPost },
    { method: "GET", pattern: "/hello", handler: handleHello },
    { method: "GET", pattern: "/", handler: handleHome },
    { method: "POST", pattern: "/echo", handler: handleEcho },
    { method: "POST", pattern: "/login", handler: handleLogin },
    { method: "POST", pattern: "/logout", handler: handleLogout},
];

export function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

const server = http.createServer((req, res) => {
    const context: RequestContext = {
        session: undefined
    }
    runMiddleware(req, res, context, async (req, res, context) => {
        await handleRequest(req, res, context, routes);
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