import http from "node:http";

export function readBody(
    req: http.IncomingMessage
): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            resolve(body);
        });

        req.on("error", (error) => {
            reject(error);
        });
    });
}