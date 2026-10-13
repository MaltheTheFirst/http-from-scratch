import http from "node:http"
import { readFile } from "node:fs/promises"

export async function serveStaticFile(
    res: http.ServerResponse, 
    filePath: string, 
    contentType: string,
    sendBody: boolean = true
): Promise<void> {
    const content = await readFile(filePath, "utf8");
    res.setHeader("Content-Type", contentType);
    if (sendBody) {
        res.end(content);
    } else {
        res.end();
    }
}