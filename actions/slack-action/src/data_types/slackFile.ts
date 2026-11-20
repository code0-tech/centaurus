import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A file hosted by Slack, as returned by the external upload flow behind
 * `slackUploadFile`.
 * See https://docs.slack.dev/reference/objects/file-object
 */
export const SlackFileSchema = z.object({
    id: z.string().describe("The file ID, e.g. F0123456789."),
    name: z.string().nullish().describe("The file name including its extension."),
    title: z.string().nullish().describe("The title shown for the file in Slack."),
    mimetype: z.string().nullish().describe("The MIME type Slack detected for the file."),
    filetype: z.string().nullish().describe("Slack's short file type, e.g. png or javascript."),
    pretty_type: z.string().nullish().describe("A human readable form of the file type, e.g. PNG."),
    user: z.string().nullish().describe("The ID of the user who uploaded the file."),
    size: z.number().nullish().describe("The file size in bytes."),
    created: z.number().nullish().describe("The Unix timestamp at which the file was created."),
    timestamp: z.number().nullish().describe("The Unix timestamp at which the file was uploaded."),
    mode: z.string().nullish().describe("How the file is stored, e.g. hosted, external or snippet."),
    is_external: z.boolean().nullish().describe("Whether the file is hosted outside of Slack."),
    is_public: z.boolean().nullish().describe("Whether the file is publicly shared within the workspace."),
    permalink: z.string().nullish().describe("A permanent link to the file in Slack."),
    permalink_public: z.string().nullish().describe("A public link to the file, if public sharing is enabled."),
    url_private: z.string().nullish().describe("An authenticated URL to download the file content."),
    channels: z.array(z.string()).nullish().describe("The IDs of the public channels the file was shared to."),
});
export type SlackFile = z.infer<typeof SlackFileSchema>;

@Identifier("SLACK_FILE")
@Name({ code: "en-US", content: "Slack file" })
@DisplayMessage({ code: "en-US", content: "Slack file" })
@Schema(SlackFileSchema)
export class SlackFileDataType {}
