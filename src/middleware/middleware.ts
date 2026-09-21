import http from "node:http";

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

export async function runMiddleware(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    handler: (
        req: http.IncomingMessage,
        res: http.ServerResponse,
    ) => Promise<void>
) {
    let index = 0;

    async function next(): Promise<void> {
        const middleware = middlewares[index];
        index++;

        if (middleware === undefined) {
            await handler(req, res);
            return;
        }

        await middleware(req, res, next);
    }

    await next();
}