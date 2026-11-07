import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { PlainValue } from "@code0-tech/hercules";
import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { AiChatRequestSchema, type AiChatRequest } from "../../datatypes/chat/Chat.request.datatype.js";
import { AiChatResponseSchema, type AiChatResponse } from "../../datatypes/chat/Chat.response.datatype.js";
import type { Logger } from "../../types/shared/Log.types.js";
import type { OpenAiEndpoint, OpenAiRequestPath } from "../../types/openai/OpenAi.types.js";
import type { OpenAiServerHost, OpenAiServerOptions } from "../../types/openai/OpenAiServer.types.js";
import { corsHeaders } from "../../utils/openai/OpenAi.corsHeaders.util.js";
import { describeError } from "../../utils/shared/Shared.describeError.util.js";
import { errorBody } from "../../utils/openai/OpenAi.errorBody.util.js";
import { logger } from "../../utils/shared/Log.logger.util.js";
import { parseRequestPath } from "../../utils/openai/OpenAi.parsePath.util.js";
import { pendingResponses } from "../../utils/openai/OpenAi.pending.util.js";
import { sendJson } from "../../utils/openai/OpenAi.sendJson.util.js";
import { toEndpoints } from "../../utils/openai/OpenAi.toEndpoints.util.js";
import { toModelList } from "../../utils/openai/OpenAi.toModelList.util.js";
import { toStreamChunks } from "../../utils/openai/OpenAi.toStream.util.js";

const DEFAULT_PORT = 8080;
/** The endpoint is reachable from outside, so a body is read only up to this. */
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const log: Logger = logger("openai");

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
        log.info("the OpenAI endpoint is configured", { port: this.port, host: this.host });
        this.server = createServer((request, response) => {
            // One identifier per request, so every line of one call can be read as a
            // sequence even while several clients are talking to the action.
            const trace: Logger = log.child(randomUUID().slice(0, 8));
            const started: number = Date.now();

            trace.info(`${request.method ?? "GET"} ${request.url ?? "/"}`, {
                headers: request.headers,
                remote: request.socket.remoteAddress,
            });
            response.on("finish", () => {
                trace.info(`answered ${response.statusCode} in ${Date.now() - started}ms`);
            });

            this.handle(request, response, trace).catch((error: unknown) => {
                trace.error("the request failed before an answer was sent", {
                    error: describeError(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                if (response.headersSent) {
                    response.end();
                    return;
                }
                sendJson(response, 500, errorBody(describeError(error), "internal_error"), trace);
            });
        });
    }

    listen(): Promise<{ port: number; host: string }> {
        return new Promise((resolve, reject) => {
            this.server.once("error", reject);
            this.server.listen(this.port, this.host, () => {
                this.server.removeListener("error", reject);
                log.info("listening", { port: this.address, host: this.host });
                resolve({ port: this.port, host: this.host });
            });
        });
    }

    close(): Promise<void> {
        log.info("closing the OpenAI endpoint");
        return new Promise((resolve) => this.server.close(() => resolve()));
    }

    /** The port the server actually listens on, which matters when 0 was asked for. */
    get address(): number {
        const address = this.server.address();
        return address && typeof address === "object" ? address.port : this.port;
    }

    private async handle(request: IncomingMessage, response: ServerResponse, trace: Logger): Promise<void> {
        const method: string = (request.method ?? "GET").toUpperCase();

        // A preflight asks what is allowed and carries neither key nor body, so it is
        // answered before anything is looked up.
        if (method === "OPTIONS") {
            trace.debug("answering a preflight");
            response.writeHead(204, corsHeaders());
            response.end();
            return;
        }

        const path: OpenAiRequestPath | undefined = parseRequestPath(request.url ?? "/");
        if (!path) {
            trace.warn("no endpoint of the protocol matches this path", { url: request.url });
            sendJson(response, 404, errorBody("Unknown endpoint.", "invalid_request_error"), trace);
            return;
        }
        trace.debug("the path resolves to", path);

        const flows: ActionFlow[] = this.action.flows();
        const known: OpenAiEndpoint[] = toEndpoints(flows);
        // The endpoints of one route, which is the project's slug plus the flow's
        // route: the route alone is only unique inside a project.
        const endpoints: OpenAiEndpoint[] = known.filter(
            (endpoint) => endpoint.slug === path.slug && endpoint.route === path.route,
        );
        trace.debug(`${flows.length} flows known, ${known.length} of them endpoints, ${endpoints.length} on this route`, {
            all: known.map((endpoint) => ({
                flow: `${endpoint.flow.flowId}`,
                slug: endpoint.slug,
                route: endpoint.route,
                model: endpoint.model,
                guarded: Boolean(endpoint.apiKey),
            })),
        });

        if (endpoints.length === 0) {
            trace.warn("no flow serves this route", { slug: path.slug, route: path.route });
            sendJson(
                response,
                404,
                errorBody(`No flow serves ${path.kind === "models" ? "models" : "completions"} here.`, "invalid_request_error"),
                trace,
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
        trace.debug("the request carries a bearer token", { present: Boolean(token) });

        if (path.kind === "models") {
            const listed: OpenAiEndpoint[] = endpoints.filter(
                (endpoint) => !endpoint.apiKey || endpoint.apiKey === token,
            );
            if (listed.length === 0) {
                trace.warn("the token matches no endpoint of this route, so nothing is listed");
                sendJson(response, 401, errorBody("Invalid API key.", "invalid_request_error", "invalid_api_key"), trace);
                return;
            }
            trace.info(
                `listing ${listed.length} of ${endpoints.length} models`,
                listed.map((endpoint) => endpoint.model),
            );
            sendJson(response, 200, toModelList(listed), trace);
            return;
        }

        if (method !== "POST") {
            trace.warn("completions were asked for with the wrong method", { method });
            response.setHeader("allow", "POST, OPTIONS");
            sendJson(
                response,
                405,
                errorBody(`Completions are asked for with POST, not ${method}.`, "invalid_request_error"),
                trace,
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
        trace.debug(`the body is ${Buffer.byteLength(body)} bytes`, body);

        let parsed: unknown;
        try {
            parsed = JSON.parse(body || "{}");
        } catch (error: unknown) {
            trace.warn("the body is not valid JSON", { error: describeError(error) });
            sendJson(response, 400, errorBody("The request body is not valid JSON.", "invalid_request_error"), trace);
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
            trace.warn("no flow of this route carries the model asked for", {
                asked: payload.model ?? null,
                available: endpoints.map((candidate) => candidate.model),
            });
            sendJson(
                response,
                404,
                errorBody(`The model "${payload.model ?? ""}" does not exist.`, "invalid_request_error", "model_not_found"),
                trace,
            );
            return;
        }
        trace.info("the request is for", {
            model: endpoint.model,
            asked_for: payload.model ?? null,
            flow: `${endpoint.flow.flowId}`,
            project: endpoint.slug,
            stream: payload.stream === true,
        });

        if (endpoint.apiKey && endpoint.apiKey !== token) {
            trace.warn("the token does not match the key the flow declared", { model: endpoint.model });
            sendJson(response, 401, errorBody("Invalid API key.", "invalid_request_error", "invalid_api_key"), trace);
            return;
        }

        const validation = AiChatRequestSchema.safeParse(parsed);
        const request_: AiChatRequest | undefined = validation.data;
        if (!request_ || request_.messages.length === 0) {
            trace.warn("the request carries nothing to answer", {
                issues: validation.error?.issues,
                messages: request_?.messages.length ?? 0,
            });
            sendJson(
                response,
                400,
                errorBody("The request carries no messages to answer.", "invalid_request_error"),
                trace,
            );
            return;
        }

        const answer: AiChatResponse | undefined = await this.run(endpoint, request_, trace);
        if (!answer) {
            sendJson(
                response,
                502,
                errorBody(
                    `The flow serving "${endpoint.model}" did not answer with a chat response.`,
                    "internal_error",
                ),
                trace,
            );
            return;
        }

        if (payload.stream === true) {
            const chunks: string[] = toStreamChunks(answer);
            trace.debug(`answering 200 as a stream of ${chunks.length} chunks`, chunks);

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
        sendJson(response, 200, answer, trace);
    }

    /**
     * Runs the flow and takes its answer, from whichever of the two comes first.
     *
     * `ai::openai::respond` is the way a flow answers: it settles the request from
     * wherever in the flow it sits, so nodes after it - logging, storing, a second
     * branch - no longer change what the client got. The flow's return value is only
     * used when the flow ended without ever responding, which keeps a flow of two
     * nodes working without a respond node.
     */
    private async run(
        endpoint: OpenAiEndpoint,
        request: AiChatRequest,
        trace: Logger,
    ): Promise<AiChatResponse | undefined> {
        const started: number = Date.now();
        // Reserved before the flow starts, because the wait has to exist by the time
        // its respond node runs - which can be before executeFlow even resolves.
        const executionId: string = this.action.reserveExecutionId();

        trace.debug(`running flow ${endpoint.flow.flowId} as execution ${executionId} with`, request);

        const responded: Promise<{ answer: AiChatResponse }> = pendingResponses
            .open(executionId, endpoint.model)
            .then((answer) => ({ answer }));
        const finished: Promise<{ result: PlainValue }> = this.action
            .executeFlowWithId(executionId, endpoint.flow.flowId, request as unknown as PlainValue)
            .then((result) => ({ result }));

        try {
            const outcome = await Promise.race([responded, finished]);

            if ("answer" in outcome) {
                trace.info(`the flow answered through respond after ${Date.now() - started}ms`);
                return this.named(outcome.answer, endpoint, trace);
            }

            trace.debug(
                `flow ${endpoint.flow.flowId} ended after ${Date.now() - started}ms without responding, taking its result`,
                outcome.result,
            );
            const validation = AiChatResponseSchema.safeParse(outcome.result);
            if (!validation.data) {
                trace.error("the flow neither responded nor returned a chat response", {
                    issues: validation.error?.issues,
                });
                return undefined;
            }
            return this.named(validation.data, endpoint, trace);
        } catch (error: unknown) {
            trace.error(`flow ${endpoint.flow.flowId} failed after ${Date.now() - started}ms`, {
                error: describeError(error),
            });
            throw error;
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
    private named(answer: AiChatResponse, endpoint: OpenAiEndpoint, trace: Logger): AiChatResponse {
        if (answer.model.trim().length > 0) return answer;
        trace.debug("the answer carries no model, so the flow's own name stands in", { model: endpoint.model });
        return { ...answer, model: endpoint.model };
    }
}
