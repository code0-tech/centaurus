import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { getSlackClient, toRuntimeError } from "../helpers.js";
import { SlackFile, SlackFileSchema } from "../data_types/slackFile.js";

@Identifier("slackUploadFile")
@DisplayIcon("simple:slack")
@Signature("(channelId: TEXT, filename: TEXT, content: TEXT, title?: TEXT): SLACK_FILE")
@Name({ code: "en-US", content: "Upload file" })
@DisplayMessage({ code: "en-US", content: "Upload ${filename} to Slack channel ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Uploads a text file and shares it into a channel, using Slack's external upload flow (`files.getUploadURLExternal` + `files.completeUploadExternal`).\nThe file extension in `filename` determines how Slack renders the content, e.g. `report.csv` or `trace.log`.",
})
@Description({ code: "en-US", content: "Uploads a file and shares it into a Slack channel." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel to share the file into." }],
})
@Parameter({
    runtimeName: "filename",
    name: [{ code: "en-US", content: "File name" }],
    description: [{ code: "en-US", content: "The file name including its extension, e.g. report.csv." }],
})
@Parameter({
    runtimeName: "content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The file content as text." }],
})
@Parameter({
    runtimeName: "title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "The title shown for the file in Slack. Defaults to the file name." }],
    optional: true,
})
export class UploadFileFunction {
    async run(
        context: FunctionContext,
        channelId: string,
        filename: string,
        content: string,
        title?: string
    ): Promise<SlackFile> {
        const client = getSlackClient(context);
        try {
            const result = await client.filesUploadV2({
                channel_id: channelId,
                filename,
                content,
                title: title ?? filename,
            });
            // filesUploadV2 batches uploads, so a single file arrives as the first
            // file of the first completion response.
            const file = result.files?.[0]?.files?.[0];
            if (!file) {
                throw new RuntimeError("SLACK_UPLOAD_FILE_FAILED", `Slack did not return a file for ${filename}.`);
            }
            return SlackFileSchema.parse(file);
        } catch (error) {
            throw toRuntimeError("SLACK_UPLOAD_FILE_FAILED", error);
        }
    }
}
