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

@Identifier("slackAddReaction")
@DisplayIcon("simple:slack")
@Signature("(channelId: TEXT, ts: TEXT, emoji: TEXT): BOOLEAN")
@Name({ code: "en-US", content: "Add reaction" })
@DisplayMessage({ code: "en-US", content: "Add :${emoji}: to Slack message ${ts}" })
@Documentation({
    code: "en-US",
    content:
        "Adds an emoji reaction to a message via `reactions.add` and returns whether Slack accepted it.\nGive the emoji name without the surrounding colons, e.g. `white_check_mark`. Use it to acknowledge a message a flow has handled.",
})
@Description({ code: "en-US", content: "Adds an emoji reaction to a Slack message." })
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel holding the message." }],
})
@Parameter({
    runtimeName: "ts",
    name: [{ code: "en-US", content: "Message timestamp" }],
    description: [{ code: "en-US", content: "The `ts` of the message to react to." }],
})
@Parameter({
    runtimeName: "emoji",
    name: [{ code: "en-US", content: "Emoji" }],
    description: [{ code: "en-US", content: "The emoji name without the surrounding colons, e.g. white_check_mark." }],
})
export class AddReactionFunction {
    async run(context: FunctionContext, channelId: string, ts: string, emoji: string): Promise<boolean> {
        const client = getSlackClient(context);
        try {
            const result = await client.reactions.add({ channel: channelId, timestamp: ts, name: emoji });
            return result.ok === true;
        } catch (error) {
            throw toRuntimeError("SLACK_ADD_REACTION_FAILED", error);
        }
    }
}
