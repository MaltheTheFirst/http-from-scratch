import http from "node:http";
import type { RequestContext } from "../http/request-context.js"
import type { AuthenticatedRequestContext } from "../http/request-context.js"

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

export type RouteHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    params: Record<string, string>,
    url: URL,
    context: RequestContext,
) => void | Promise<void>;

export type AuthenticatedRouteHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    params: Record<string, string>,
    url: URL,
    context: AuthenticatedRequestContext
) => void | Promise<void>;

export type Route = {
    method: string,
    pattern: string,
    handler: RouteHandler
};

export async function handleRequest(
    req: http.IncomingMessage, 
    res: http.ServerResponse,
    context: RequestContext,
    routes: Route[]
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
        await route.handler(req, res, match, url, context);
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