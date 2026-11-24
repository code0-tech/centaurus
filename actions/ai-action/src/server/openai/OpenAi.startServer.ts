import type { OpenAiServerHost, OpenAiServerOptions } from "../../types/openai/OpenAiServer.types.js";
import { OpenAiServer } from "./OpenAi.server.js";

/**
 * Starts the OpenAI endpoint of every project this action serves. It is the action's
 * own HTTP server: a flow bound to `ai::openai::server` is reachable the moment
 * aquila tells the action about it, with nothing in between to configure.
 */
export async function startOpenAiServer(
    action: OpenAiServerHost,
    options: OpenAiServerOptions = {},
): Promise<OpenAiServer> {
    const server = new OpenAiServer(action, options);
    await server.listen();
    return server;
}
