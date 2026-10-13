import path from "node:path"
import http from "node:http"
import { sendJson } from "../http/send-json.js"
import { serveStaticFile } from "../http/serve-static-file.js"
import { isRecord } from "../server.js"

export async function tryServeStaticFile(res: http.ServerResponse, url: URL, method: string | undefined): Promise<boolean> {
    const relativePath = url.pathname.slice(1);
    const publicDirectory = path.resolve("public");
    const filePath = path.resolve(publicDirectory, relativePath);
    const extension = path.extname(filePath).toLowerCase();
    const pathFromPublic = path.relative(publicDirectory, filePath);
    const sendBody = method !== "HEAD";

    if (
        pathFromPublic === ".." || 
        pathFromPublic.startsWith(`..${path.sep}`) || 
        path.isAbsolute(pathFromPublic)
    ) {
        res.statusCode = 403;
        sendJson(res, { error: "Access denied" });
        return true;
    }

    let contentType: string;

    switch (extension) {
        case ".html":
            contentType = "text/html; charset=utf-8";
            break;
        
        case ".js":
            contentType = "application/javascript; charset=utf-8";
            break;

        case ".css":
            contentType = "text/css; charset=utf-8";
            break;

        default:
            contentType = "application/octet-stream";
            break;
    }

    try {
        await serveStaticFile(res, filePath, contentType, sendBody);
        return true;
    } catch (error) {
        if (isRecord(error) && error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
    return true;
};