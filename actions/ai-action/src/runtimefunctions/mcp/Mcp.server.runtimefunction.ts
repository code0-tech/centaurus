import {
    Alias,
    Description,
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
    ThrowsError,
} from "@code0-tech/hercules";
import { AiMcpServerSchema, type AiMcpServer } from "../../datatypes/mcp/Mcp.server.datatype.js";
import { asList } from "../../utils/shared/Shared.asList.util.js";
import { parseOrThrow } from "../../utils/shared/Shared.parseOrThrow.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";
import { toPlainSchema } from "../../utils/shared/Shared.toPlainSchema.util.js";

/**
 * The older of the two ways a server over the web is reached. Which one a server
 * speaks is not announced anywhere, so it is taken from the address: a server on the
 * older protocol is reached at its own event path, which is what that path is for,
 * while everything else speaks the current one.
 */
const EVENT_STREAM_PATH = /\/sse\/?$/;

@Identifier("ai::mcp::server")
@DisplayIcon("thesvg:model-context-protocol/mono")
@Signature(
    "(name: TEXT, address: TEXT, access_token?: TEXT, headers?: OBJECT<{ [key: string]: string }>, allowed_tools?: LIST<TEXT>): AI_MCP_SERVER",
)
@Name({ code: "en-US", content: "MCP server" })
@Alias({ code: "en-US", content: "mcp;model context protocol;tools;integration;server;connector" })
@Description({
    code: "en-US",
    content:
        "A ready-made set of tools an agent can use, hosted elsewhere - a ticket system, a shop, a wiki. Give it to an agent as a tool: it asks the server what it offers and picks on its own.",
})
@DisplayMessage({ code: "en-US", content: "The tools of ${name}" })
@ThrowsError()
@Parameter({
    runtimeName: "name",
    name: [{ code: "en-US", content: "Name" }],
    description: [
        {
            code: "en-US",
            content:
                "What this set of tools is called, chosen by you - \"tickets\", \"shop\". The agent sees it in front of every tool of the server, so two servers of one agent may not share a name.",
        },
    ],
})
@Parameter({
    runtimeName: "address",
    name: [{ code: "en-US", content: "Address" }],
    description: [
        {
            code: "en-US",
            content:
                "The web address the provider gives you for its tools, pasted as it stands - for example \"https://example.com/mcp\". It has to start with http:// or https://.",
        },
    ],
})
@Parameter({
    runtimeName: "access_token",
    name: [{ code: "en-US", content: "Access token" }],
    description: [
        {
            code: "en-US",
            content:
                "The token the provider gives you to prove the request is yours. Keep it in a secret, not in the node. Left empty nothing is sent, which only works for a server that asks for nothing.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "headers",
    name: [{ code: "en-US", content: "Extra headers" }],
    description: [
        {
            code: "en-US",
            content:
                "Only for a server that wants something else sent along than an access token: the headers it asks for, spelled exactly as its documentation spells them. Leave this empty unless you were told otherwise.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "allowed_tools",
    name: [{ code: "en-US", content: "Allowed tools" }],
    description: [
        {
            code: "en-US",
            content:
                "The tools of this server the agent may use, named as the server names them. Left empty it may use all of them, including the ones the server adds later.",
        },
    ],
    optional: true,
})
export class McpServerFunction {
    /**
     * Describes a hosted set of tools, rather than connecting to it: the agent node
     * opens the connections itself and closes them when it is done, so a server
     * described here is only reached while an agent that was handed it works.
     */
    run(
        _context: FunctionContext,
        name: string,
        address: string,
        access_token?: string,
        headers?: unknown,
        allowed_tools?: unknown[],
    ): AiMcpServer {
        const named: string = requireText(name, "ERROR_INVALID_AI_MCP_SERVER", "An MCP server needs a name.");
        const url: string = requireText(
            address,
            "ERROR_INVALID_AI_MCP_SERVER",
            `The MCP server "${named}" needs the address its tools are served at.`,
        );

        // A mistyped address is caught here rather than when the agent starts
        // working, because here it is still clear which node is wrong.
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            throw new RuntimeError(
                "ERROR_INVALID_AI_MCP_SERVER",
                `"${url}" is not a web address, so the MCP server "${named}" cannot be reached at it.`,
            );
        }
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            throw new RuntimeError(
                "ERROR_INVALID_AI_MCP_SERVER",
                `The address of the MCP server "${named}" has to start with http:// or https://, but it starts with ${parsedUrl.protocol}`,
            );
        }

        // What is sent with every request: the access token in the form every MCP
        // server expects it, and whatever else the server asked for on top - listed
        // last, so a server wanting its own kind of authorization can say so.
        const sent: Record<string, string> = {};
        if (typeof access_token === "string" && access_token.trim().length > 0) {
            sent.Authorization = `Bearer ${access_token.trim()}`;
        }
        Object.entries(toPlainSchema(headers) ?? {}).forEach(([header, value]) => {
            if (typeof value !== "string") {
                throw new RuntimeError(
                    "ERROR_INVALID_AI_MCP_SERVER",
                    `The header "${header}" of the MCP server "${named}" has to be a text, but a ${typeof value} was passed.`,
                );
            }
            sent[header] = value;
        });

        const tools: string[] = asList(allowed_tools, "allowed_tools").map((tool, index) =>
            requireText(
                tool,
                "ERROR_INVALID_AI_MCP_SERVER",
                `Entry ${index + 1} of "allowed_tools" has to be the name of a tool of "${named}".`,
            ),
        );

        return parseOrThrow(
            AiMcpServerSchema,
            {
                name: named,
                transport: EVENT_STREAM_PATH.test(parsedUrl.pathname) ? "sse" : "http",
                url,
                ...(Object.keys(sent).length > 0 ? { headers: sent } : {}),
                ...(tools.length > 0 ? { allowed_tools: tools } : {}),
            },
            "ERROR_INVALID_AI_MCP_SERVER",
            `The MCP server "${named}" is not valid`,
        );
    }
}
