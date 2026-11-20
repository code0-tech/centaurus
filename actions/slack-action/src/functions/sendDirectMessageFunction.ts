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
import { getSlackClient, toBlockArgument, toRuntimeError } from "../helpers.js";
import { SlackBlock } from "../data_types/slackBlock.js";
import { SlackMessage, SlackMessageSchema } from "../data_types/slackMessage.js";

@Identifier("slackSendDirectMessage")
@DisplayIcon("simple:slack")
@Signature("(userId: TEXT, text: TEXT, blocks?: LIST<SLACK_BLOCK>): SLACK_MESSAGE")
@Name({ code: "en-US", content: "Send direct message" })
@DisplayMessage({ code: "en-US", content: "Send Slack DM to ${userId}" })
@Documentation({
    code: "en-US",
    content:
        "Sends a direct message to a single user. Opens (or reuses) the IM channel between the bot and the user via `conversations.open`, then posts into it.\nLook the user up by email first with `slackGetUserByEmail` if the flow only knows an address.",
})
@Description({ code: "en-US", content: "Sends a direct message to a Slack user." })
@Parameter({
    runtimeName: "userId",
    name: [{ code: "en-US", content: "User ID" }],
    description: [{ code: "en-US", content: "The ID of the user to message (e.g. U0123456789)." }],
})
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [
        {
            code: "en-US",
            content: "The message text. Used as the notification and accessibility fallback when blocks are provided.",
        },
    ],
})
@Parameter({
    runtimeName: "blocks",
    name: [{ code: "en-US", content: "Blocks" }],
    description: [{ code: "en-US", content: "Block Kit blocks making up the message body." }],
    optional: true,
})
export class SendDirectMessageFunction {
    async run(context: FunctionContext, userId: string, text: string, blocks?: SlackBlock[]): Promise<SlackMessage> {
        const client = getSlackClient(context);
        try {
            const conversation = await client.conversations.open({ users: userId });
            const channelId = conversation.channel?.id;
            if (!channelId) {
                throw new RuntimeError(
                    "SLACK_SEND_DIRECT_MESSAGE_FAILED",
                    `Slack did not return an IM channel for user ${userId}.`
                );
            }

            const result = await client.chat.postMessage({
                channel: channelId,
                text,
                ...toBlockArgument(blocks),
            });
            return SlackMessageSchema.parse({ ...result.message, ok: result.ok, channel: result.channel, ts: result.ts });
        } catch (error) {
            throw toRuntimeError("SLACK_SEND_DIRECT_MESSAGE_FAILED", error);
        }
    }
}
