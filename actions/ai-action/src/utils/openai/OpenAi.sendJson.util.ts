import type { ServerResponse } from "node:http";
import type { Logger } from "../../types/shared/Log.types.js";
import { corsHeaders } from "./OpenAi.corsHeaders.util.js";

/** Answers with JSON, which is every answer of this endpoint but a stream. */
export function sendJson(response: ServerResponse, status: number, body: unknown, trace: Logger): void {
    const payload: string = JSON.stringify(body);
    trace.debug(`answering ${status} as json`, body);

    response.writeHead(status, {
        ...corsHeaders(),
        "content-type": "application/json",
        "content-length": Buffer.byteLength(payload),
    });
    response.end(payload);
}
