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
import { getSlackClient, toRuntimeError } from "../helpers.js";

@Identifier("slackDeleteMessage")
@DisplayIcon("simple:slack")
@Signature("(channelId: TEXT, ts: TEXT): BOOLEAN")
@Name({ code: "en-US", content: "Delete message" })
@DisplayMessage({ code: "en-US", content: "Delete Slack message ${ts}" })
@Documentation({
    code: "en-US",
    content:
        "Deletes a message via `chat.delete` and returns whether Slack accepted the deletion.\nA bot token can only delete messages the app itself posted.",
})
@Description({ code: "en-US", content: "Deletes a Slack message the app posted." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel holding the message." }],
})
@Parameter({
    runtimeName: "ts",
    name: [{ code: "en-US", content: "Message timestamp" }],
    description: [{ code: "en-US", content: "The `ts` of the message to delete." }],
})
export class DeleteMessageFunction {
    async run(context: FunctionContext, channelId: string, ts: string): Promise<boolean> {
        const client = getSlackClient(context);
        try {
            const result = await client.chat.delete({ channel: channelId, ts });
            return result.ok === true;
        } catch (error) {
            throw toRuntimeError("SLACK_DELETE_MESSAGE_FAILED", error);
        }
    }
}
