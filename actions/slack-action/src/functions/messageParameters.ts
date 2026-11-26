/** Parameters shared by the functions that post or update a message. */

export const TEXT_PARAMETER = {
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [
        {
            code: "en-US",
            content:
                "The message text. Supports Slack markdown such as *bold*, _italic_ and <https://example.com|links>. Optional if an embed is given.",
        },
    ],
    optional: true,
};

export const EMBED_PARAMETER = {
    runtimeName: "embed",
    name: [{ code: "en-US", content: "Embed" }],
    description: [
        {
            code: "en-US",
            content: "A rich card shown below the text: a title, text, label/value fields, images and a footer. Every part is optional.",
        },
    ],
    optional: true,
};

export const MESSAGE_TS_DESCRIPTION =
    "Use the ts of a message from a previous step, e.g. of Post message or of a Slack trigger.";
