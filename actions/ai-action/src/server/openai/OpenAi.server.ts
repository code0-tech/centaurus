import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { PlainValue } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { AiChatRequestSchema, type AiChatRequest } from "../../datatypes/chat/Chat.request.datatype.js";
import { AiChatResponseSchema, type AiChatResponse } from "../../datatypes/chat/Chat.response.datatype.js";
import type { OpenAiEndpoint, OpenAiRequestPath } from "../../types/openai/OpenAi.types.js";
import type { OpenAiServerHost, OpenAiServerOptions } from "../../types/openai/OpenAiServer.types.js";
import { corsHeaders } from "../../utils/openai/OpenAi.corsHeaders.util.js";
import { describeError } from "../../utils/shared/Shared.describeError.util.js";
import { errorBody } from "../../utils/openai/OpenAi.errorBody.util.js";
import { parseRequestPath } from "../../utils/openai/OpenAi.parsePath.util.js";
import { pendingResponses } from "../../utils/openai/OpenAi.pending.util.js";
import { sendJson } from "../../utils/openai/OpenAi.sendJson.util.js";
import { toEndpoints } from "../../utils/openai/OpenAi.toEndpoints.util.js";
import { toModelList } from "../../utils/openai/OpenAi.toModelList.util.js";
import { toStreamChunks } from "../../utils/openai/OpenAi.toStream.util.js";

const DEFAULT_PORT = 8080;
/** The endpoint is reachable from outside, so a body is read only up to this. */
const MAX_BODY_BYTES = 10 * 1024 * 1024;

export class OpenAiServer {
    private readonly server: Server;
    private readonly port: number;
    private readonly host: string;

    constructor(
        private readonly action: OpenAiServerHost,
        options: OpenAiServerOptions = {},
    ) {
        this.port = options.port ?? Number(process.env.AI_OPENAI_PORT ?? process.env.PORT ?? DEFAULT_PORT);
        this.host = options.host ?? "0.0.0.0";
        this.server = createServer((request, response) => {
            this.handle(request, response).catch((error: unknown) => {
                if (response.headersSent) {
                    response.end();
                    return;
                }
                sendJson(response, 500, errorBody(describeError(error), "internal_error"));
            });
        });
    }

    listen(): Promise<{ port: number; host: string }> {
        return new Promise((resolve, reject) => {
            this.server.once("error", reject);
            this.server.listen(this.port, this.host, () => {
                this.server.removeListener("error", reject);
                resolve({ port: this.port, host: this.host });
            });
        });
    }

    close(): Promise<void> {
        return new Promise((resolve) => this.server.close(() => resolve()));
    }

    /** The port the server actually listens on, which matters when 0 was asked for. */
    get address(): number {
        const address = this.server.address();
        return address && typeof address === "object" ? address.port : this.port;
    }

    private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
        const method: string = (request.method ?? "GET").toUpperCase();

        // A preflight asks what is allowed and carries neither key nor body, so it is
        // answered before anything is looked up.
        if (method === "OPTIONS") {
            response.writeHead(204, corsHeaders());
            response.end();
            return;
        }

        const path: OpenAiRequestPath | undefined = parseRequestPath(request.url ?? "/");
        if (!path) {
            sendJson(response, 404, errorBody("Unknown endpoint.", "invalid_request_error"));
            return;
        }

        const flows: ActionFlow[] = this.action.flows();
        const known: OpenAiEndpoint[] = toEndpoints(flows);
        // The endpoints of one route, which is the project's slug plus the flow's
        // route: the route alone is only unique inside a project.
        const endpoints: OpenAiEndpoint[] = known.filter(
            (endpoint) => endpoint.slug === path.slug && endpoint.route === path.route,
        );

        if (endpoints.length === 0) {
            sendJson(
                response,
                404,
                errorBody(`No flow serves ${path.kind === "models" ? "models" : "completions"} here.`, "invalid_request_error"),
            );
            return;
        }

        // Each flow of a route may carry its own key, so a request is let through by
        // the key of the endpoint it is for - checked again per flow below.
        const authorization: string | undefined = request.headers.authorization ?? undefined;
        const apiKeyHeader = request.headers["api-key"];
        // Either header a client may send the key in.
        const token: string | undefined =
            authorization?.replace(/^Bearer\s+/i, "").trim() ||
            (Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader)?.trim() ||
            undefined;

        if (path.kind === "models") {
            const listed: OpenAiEndpoint[] = endpoints.filter(
                (endpoint) => !endpoint.apiKey || endpoint.apiKey === token,
            );
            if (listed.length === 0) {
                sendJson(response, 401, errorBody("Invalid API key.", "invalid_request_error", "invalid_api_key"));
                return;
            }
            sendJson(response, 200, toModelList(listed));
            return;
        }

        if (method !== "POST") {
            response.setHeader("allow", "POST, OPTIONS");
            sendJson(
                response,
                405,
                errorBody(`Completions are asked for with POST, not ${method}.`, "invalid_request_error"),
            );
            return;
        }

        let read = 0;
        const parts: Buffer[] = [];
        for await (const chunk of request) {
            const part = chunk as Buffer;
            read += part.byteLength;
            if (read > MAX_BODY_BYTES) throw new Error("the request body is too large");
            parts.push(part);
        }
        const body: string = Buffer.concat(parts).toString("utf8");

        let parsed: unknown;
        try {
            parsed = JSON.parse(body || "{}");
        } catch {
            sendJson(response, 400, errorBody("The request body is not valid JSON.", "invalid_request_error"));
            return;
        }

        const payload = parsed as { model?: string; stream?: boolean };
        // A client sends the model it picked from `/models`, so that name decides; a
        // request naming nothing - or naming a model this route does not have - is
        // served by the route's only flow, because then there is nothing else it
        // could have meant.
        const asked: string = payload.model?.trim() ?? "";
        const endpoint: OpenAiEndpoint | undefined =
            endpoints.find((candidate) => candidate.model === asked) ??
            (endpoints.length === 1 ? endpoints[0] : undefined);
        if (!endpoint) {
            sendJson(
                response,
                404,
                errorBody(`The model "${payload.model ?? ""}" does not exist.`, "invalid_request_error", "model_not_found"),
            );
            return;
        }

        if (endpoint.apiKey && endpoint.apiKey !== token) {
            sendJson(response, 401, errorBody("Invalid API key.", "invalid_request_error", "invalid_api_key"));
            return;
        }

        const validation = AiChatRequestSchema.safeParse(parsed);
        const request_: AiChatRequest | undefined = validation.data;
        if (!request_ || request_.messages.length === 0) {
            sendJson(
                response,
                400,
                errorBody("The request carries no messages to answer.", "invalid_request_error"),
            );
            return;
        }

        const answer: AiChatResponse | undefined = await this.run(endpoint, request_);
        if (!answer) {
            sendJson(
                response,
                502,
                errorBody(
                    `The flow serving "${endpoint.model}" did not answer with a chat response.`,
                    "internal_error",
                ),
            );
            return;
        }

        if (payload.stream === true) {
            const chunks: string[] = toStreamChunks(answer);

            response.writeHead(200, {
                ...corsHeaders(),
                "content-type": "text/event-stream",
                "cache-control": "no-cache",
                connection: "keep-alive",
            });
            for (const chunk of chunks) response.write(`data: ${chunk}\n\n`);
            response.end();
            return;
        }
        sendJson(response, 200, answer);
    }

    /**
     * Runs the flow and takes its answer, from whichever of the two comes first.
     *
     * `ai::openai::respond` is the way a flow answers: it settles the request from
     * wherever in the flow it sits, so nodes after it - storing, a second branch -
     * no longer change what the client got. The flow's return value is only used
     * when the flow ended without ever responding, which keeps a flow of two nodes
     * working without a respond node.
     */
    private async run(endpoint: OpenAiEndpoint, request: AiChatRequest): Promise<AiChatResponse | undefined> {
        // Reserved before the flow starts, because the wait has to exist by the time
        // its respond node runs - which can be before executeFlow even resolves.
        const executionId: string = this.action.reserveExecutionId();

        const responded: Promise<{ answer: AiChatResponse }> = pendingResponses
            .open(executionId, endpoint.model)
            .then((answer) => ({ answer }));
        const finished: Promise<{ result: PlainValue }> = this.action
            .executeFlowWithId(executionId, endpoint.flow.flowId, request as unknown as PlainValue)
            .then((result) => ({ result }));

        try {
            const outcome = await Promise.race([responded, finished]);

            if ("answer" in outcome) return this.named(outcome.answer, endpoint);

            const validation = AiChatResponseSchema.safeParse(outcome.result);
            if (!validation.data) return undefined;
            return this.named(validation.data, endpoint);
        } finally {
            // Whatever happened, nothing is waiting any more: a later respond call
            // finds no connection rather than settling a request that is gone.
            pendingResponses.close(executionId);
        }
    }

    /**
     * The answer with a model name on it. A client matches what comes back against
     * the model it asked for, so the flow's own name stands in where a flow - or an
     * agent that reported no model - left the field empty.
     */
    private named(answer: AiChatResponse, endpoint: OpenAiEndpoint): AiChatResponse {
        if (answer.model.trim().length > 0) return answer;
        return { ...answer, model: endpoint.model };
    }
}
