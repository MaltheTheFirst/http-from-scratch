import http from "node:http";

export function sendJson(
    res: http.ServerResponse,
    data: unknown
) {
    const body = JSON.stringify(data);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(body);
}