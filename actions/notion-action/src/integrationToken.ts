/**
 * The action holds no credentials of its own: every function and every trigger
 * takes the integration token it works with as its first parameter, a plain
 * text value, so one running action serves as many Notion integrations as its
 * flows use.
 */
const TOKEN_HINT = "The internal integration secret (ntn_... or secret_...). Find it under Settings > Connections > Develop or manage integrations, and share the pages and databases with the integration.";

/** The first parameter of every Notion function. */
export const INTEGRATION_TOKEN_PARAMETER = {
    runtimeName: "integrationToken",
    name: [{ code: "en-US", content: "Notion integration token" }],
    description: [{ code: "en-US", content: TOKEN_HINT }],
};

/** The first setting of every Notion trigger. */
export const INTEGRATION_TOKEN_SETTING = {
    identifier: "integrationToken",
    name: [{ code: "en-US", content: "Notion integration token" }],
    description: [{ code: "en-US", content: TOKEN_HINT }],
    linkedDataTypeIdentifiers: ["TEXT"],
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
