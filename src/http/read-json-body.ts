import http from "node:http";
import { readBody } from "../http/read-body.js"

type Success = {
    ok: true;
    data: unknown;
}

type Failure = {
    ok: false;
    statusCode: 400 | 415;
    error: string;
}

type ReadJsonResult = Success | Failure;

export async function readJsonBody(
    req: http.IncomingMessage
): Promise<ReadJsonResult> {
    const contentType = req.headers["content-type"];

    if (contentType === undefined) {
        return {
            ok: false,
            statusCode: 415,
            error: "Missing content type"
        };
    }
    const parts = contentType.split(";");
    const mediaType = parts[0];

    if (mediaType !== "application/json") {
        return {
            ok: false,
            statusCode: 415,
            error: "Unsupported media type"
        };
    } 

    let body: string;
    
    try {
        body = await readBody(req);
    } catch {
        return {
            ok: false,
            statusCode: 400,
            error: "Failed to read request body"
        };
    }

    try {
        const parsedBody: unknown = JSON.parse(body);
        return {
            ok: true,
            data: parsedBody
        };
    } catch {
        return {
            ok: false,
            statusCode: 400,
            error: "Invalid JSON in request body"
        };
    }
}