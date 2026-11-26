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
import { getSlackClient, toRuntimeError, toSlackTs } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { MESSAGE_TS_DESCRIPTION } from "./messageParameters.js";

const CODE = "SLACK_DELETE_MESSAGE_FAILED";

@Identifier("slackDeleteMessage")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, channelId: TEXT, ts: DATE): BOOLEAN")
@Name({ code: "en-US", content: "Delete message" })
@DisplayMessage({ code: "en-US", content: "Delete Slack message in ${channelId}" })
@Documentation({
    code: "en-US",
    content:
        "Deletes a message via `chat.delete` and returns whether Slack accepted the deletion.\nA bot token can only delete messages the app itself posted.",
})
@Description({ code: "en-US", content: "Deletes a Slack message the app posted." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel holding the message." }],
})
@Parameter({
    runtimeName: "ts",
    name: [{ code: "en-US", content: "Message" }],
    description: [{ code: "en-US", content: `The ts of the message to delete. ${MESSAGE_TS_DESCRIPTION}` }],
})
export class DeleteMessageFunction {
    async run(_context: FunctionContext, botToken: SlackBotToken, channelId: string, ts: number): Promise<boolean> {
        const client = getSlackClient(botToken);
        try {
            const result = await client.chat.delete({ channel: channelId, ts: toSlackTs(ts, CODE) });
            return result.ok === true;
        } catch (error) {
            throw toRuntimeError(CODE, error);
        }
    }
}
