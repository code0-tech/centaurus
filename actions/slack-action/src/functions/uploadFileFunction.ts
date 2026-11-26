import {
    Description,
    type File,
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
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { parseSlackFile, SlackFile } from "../data_types/slackFile.js";

@Identifier("slackUploadFile")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, channelId: TEXT, file: FILE<TEXT>, title?: TEXT): SLACK_FILE")
@Name({ code: "en-US", content: "Upload file" })
@DisplayMessage({ code: "en-US", content: "Upload file to Slack channel ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Uploads a file and shares it into a channel, using Slack's external upload flow (`files.getUploadURLExternal` + `files.completeUploadExternal`).\nThe file's name, including its extension, is used as the file name in Slack and determines how Slack renders the content, e.g. `report.csv` or `screenshot.png`.",
})
@Description({ code: "en-US", content: "Uploads a file and shares it into a Slack channel." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel to share the file into." }],
})
@Parameter({
    runtimeName: "file",
    name: [{ code: "en-US", content: "File" }],
    description: [{ code: "en-US", content: "The file to upload. Its file name, including the extension, is used in Slack." }],
})
@Parameter({
    runtimeName: "title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "The title shown for the file in Slack. Defaults to the file name." }],
    optional: true,
})
export class UploadFileFunction {
    async run(_context: FunctionContext, botToken: SlackBotToken, channelId: string, file: File<string>, title?: string): Promise<SlackFile> {
        const client = getSlackClient(botToken);
        try {
            const result = await client.filesUploadV2({
                channel_id: channelId,
                filename: file.fileName,
                file: Buffer.from(file.value, "base64"),
                title: title ?? file.fileName,
            });
            // filesUploadV2 batches uploads, so a single file arrives as the first
            // file of the first completion response.
            const uploaded = result.files?.[0]?.files?.[0];
            if (!uploaded) {
                throw new RuntimeError("SLACK_UPLOAD_FILE_FAILED", `Slack did not return a file for ${file.fileName}.`);
            }
            return parseSlackFile(uploaded);
        } catch (error) {
            throw toRuntimeError("SLACK_UPLOAD_FILE_FAILED", error);
        }
    }
}
