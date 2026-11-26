import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * The action holds no credentials of its own: every function and every trigger
 * takes the integration token it works with as its first parameter, so one
 * running action serves as many Notion integrations as its flows use.
 */
export const NotionIntegrationTokenSchema = z
    .string()
    .describe(
        "The internal integration secret (ntn_... or secret_...). Find it under Settings > Connections > Develop or manage integrations, and share the pages and databases with the integration."
    );
export type NotionIntegrationToken = z.infer<typeof NotionIntegrationTokenSchema>;

@Identifier("NOTION_INTEGRATION_TOKEN")
@Name({ code: "en-US", content: "Notion integration token" })
@DisplayMessage({ code: "en-US", content: "Notion integration token" })
@Schema(NotionIntegrationTokenSchema)
export class NotionIntegrationTokenDataType {}

/** The first parameter of every Notion function. */
export const INTEGRATION_TOKEN_PARAMETER = {
    runtimeName: "integrationToken",
    name: [{ code: "en-US", content: "Notion integration token" }],
    description: [{ code: "en-US", content: "The integration token of the Notion integration to use." }],
};

/** The first setting of every Notion trigger. */
export const INTEGRATION_TOKEN_SETTING = {
    identifier: "integrationToken",
    name: [{ code: "en-US", content: "Notion integration token" }],
    description: [{ code: "en-US", content: "The integration token of the Notion integration to poll with." }],
    linkedDataTypeIdentifiers: ["NOTION_INTEGRATION_TOKEN"],
};

/** The optional poll interval of every Notion trigger. */
export const POLL_INTERVAL_SETTING = {
    identifier: "pollIntervalSeconds",
    name: [{ code: "en-US", content: "Poll interval (seconds)" }],
    description: [
        {
            code: "en-US",
            content:
                "How often this trigger checks Notion for changes. Minimum 10 seconds; defaults to 60 seconds. Each check is one Notion API request, and Notion allows about three requests per second per integration.",
        },
    ],
    linkedDataTypeIdentifiers: ["NUMBER"],
    optional: true,
};
