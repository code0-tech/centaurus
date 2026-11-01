import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { getSlackClient, toBlockArgument, toRuntimeError } from "../helpers.js";
import { SlackBlock } from "../data_types/slackBlock.js";
import { SlackMessage, SlackMessageSchema } from "../data_types/slackMessage.js";

@Identifier("slackUpdateMessage")
@DisplayIcon("simple:slack")
@Signature("(channelId: TEXT, ts: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE")
@Name({ code: "en-US", content: "Update message" })
@DisplayMessage({ code: "en-US", content: "Update Slack message ${ts}" })
@Documentation({
    code: "en-US",
    content:
        "Replaces the content of a message the app posted, via `chat.update`.\nUse it to turn an approval prompt into its outcome, or to keep a long running status message current instead of posting again.",
})
@Description({ code: "en-US", content: "Updates an existing Slack message." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel holding the message." }],
})
@Parameter({
    runtimeName: "ts",
    name: [{ code: "en-US", content: "Message timestamp" }],
    description: [{ code: "en-US", content: "The `ts` of the message to update." }],
})
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [{ code: "en-US", content: "The new message text. Replaces the previous text entirely." }],
})
@Parameter({
    runtimeName: "blocks",
    name: [{ code: "en-US", content: "Blocks" }],
    description: [{ code: "en-US", content: "The new Block Kit blocks. Replace the previous blocks entirely." }],
    optional: true,
})
export class UpdateMessageFunction {
    async run(
        context: FunctionContext,
        channelId: string,
        ts: string,
        text: string,
        blocks?: SlackBlock[]
    ): Promise<SlackMessage> {
        const client = getSlackClient(context);
        try {
            const result = await client.chat.update({
                channel: channelId,
                ts,
                text,
                ...toBlockArgument(blocks),
            });
            return SlackMessageSchema.parse({ ...result.message, ok: result.ok, channel: result.channel, ts: result.ts });
        } catch (error) {
            throw toRuntimeError("SLACK_UPDATE_MESSAGE_FAILED", error);
        }
    }
}
