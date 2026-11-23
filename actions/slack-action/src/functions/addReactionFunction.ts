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

/**
 * Slack expects the bare emoji name, but users naturally type it the way Slack
 * shows it (`:thumbsup:`). Strip whitespace and the surrounding colons while
 * keeping inner ones such as `thumbsup::skin-tone-2`.
 */
export function normalizeEmojiName(emoji: string): string {
    return emoji.trim().replace(/^:+|:+$/g, "");
}

@Identifier("slackAddReaction")
@DisplayIcon("tabler:brand-slack")
@Signature("(channelId: TEXT, ts: TEXT, emoji: TEXT): BOOLEAN")
@Name({ code: "en-US", content: "Add reaction" })
@DisplayMessage({ code: "en-US", content: "Add :${emoji}: to Slack message ${ts}" })
@Documentation({
    code: "en-US",
    content:
        "Adds an emoji reaction to a message via `reactions.add` and returns whether Slack accepted it.\nGive the emoji name, e.g. `white_check_mark`; surrounding colons (`:white_check_mark:`) are stripped. Unicode emoji such as 👍 are not accepted by Slack. Use it to acknowledge a message a flow has handled.",
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
    description: [{ code: "en-US", content: "The `ts` of the message to react to. Format: Unix seconds with a dot before the last six digits, e.g. 1712345678.123456. From a message link (…/p1712345678123456) insert the dot before the last six digits." }],
})
@Parameter({
    runtimeName: "emoji",
    name: [{ code: "en-US", content: "Emoji" }],
    description: [{ code: "en-US", content: "The emoji name, e.g. white_check_mark or :white_check_mark:." }],
})
export class AddReactionFunction {
    async run(context: FunctionContext, channelId: string, ts: string, emoji: string): Promise<boolean> {
        const client = getSlackClient(context);
        try {
            const result = await client.reactions.add({ channel: channelId, timestamp: ts, name: normalizeEmojiName(emoji) });
            return result.ok === true;
        } catch (error) {
            throw toRuntimeError("SLACK_ADD_REACTION_FAILED", error);
        }
    }
}
