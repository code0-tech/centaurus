import type { ServerResponse } from "node:http";
import { corsHeaders } from "./OpenAi.corsHeaders.util.js";

/** Answers with JSON, which is every answer of this endpoint but a stream. */
export function sendJson(response: ServerResponse, status: number, body: unknown): void {
    const payload: string = JSON.stringify(body);

    response.writeHead(status, {
        ...corsHeaders(),
        "content-type": "application/json",
        "content-length": Buffer.byteLength(payload),
    });
    response.end(payload);
}
