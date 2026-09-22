import http from "node:http";
import type { RequestContext } from "../http/request-context.js"
import { parseCookies } from "../http/parse-cookies.js"
import { getSession } from "../sessions/session-store.js"

type MiddleWare = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: () => Promise<void>,
    context: RequestContext,
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

const sessionMiddleware: MiddleWare = async (req, res, next, context) => {
    const cookies = parseCookies(req.headers.cookie);
    const cookie = cookies.session

    if (cookie !== undefined) {
        context.session = getSession(cookie);
    }

    await next();
}

const middlewares: MiddleWare[] = [
    logger,
    timer,
    sessionMiddleware,
];

export async function runMiddleware(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    context: RequestContext,
    handler: (
        req: http.IncomingMessage,
        res: http.ServerResponse,
        context: RequestContext,
    ) => Promise<void>
) {
    let index = 0;

    async function next(): Promise<void> {
        const middleware = middlewares[index];
        index++;

        if (middleware === undefined) {
            await handler(req, res, context);
            return;
        }

        await middleware(req, res, next, context);
    }

    await next();
}