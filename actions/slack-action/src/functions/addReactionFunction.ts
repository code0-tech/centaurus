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
import { getSlackClient, toRuntimeError, toMessageTs } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { MESSAGE_ID_DESCRIPTION } from "./messageParameters.js";

const CODE = "SLACK_ADD_REACTION_FAILED";

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
@Signature("(botToken: SLACK_BOT_TOKEN, channelId: TEXT, messageId: TEXT, emoji: TEXT): BOOLEAN")
@Name({ code: "en-US", content: "Add reaction" })
@DisplayMessage({ code: "en-US", content: "Add :${emoji}: to Slack message" })
@Documentation({
    code: "en-US",
    content:
        "Adds an emoji reaction to a message via `reactions.add` and returns whether Slack accepted it.\nGive the emoji name, e.g. `white_check_mark`; surrounding colons (`:white_check_mark:`) are stripped. Unicode emoji such as 👍 are not accepted by Slack. Use it to acknowledge a message a flow has handled.",
})
@Description({ code: "en-US", content: "Adds an emoji reaction to a Slack message." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the channel holding the message." }],
})
@Parameter({
    runtimeName: "messageId",
    name: [{ code: "en-US", content: "Message ID" }],
    description: [{ code: "en-US", content: `The ID of the message to react to. ${MESSAGE_ID_DESCRIPTION}` }],
})
@Parameter({
    runtimeName: "emoji",
    name: [{ code: "en-US", content: "Emoji" }],
    description: [{ code: "en-US", content: "The emoji name, e.g. white_check_mark or :white_check_mark:." }],
})
export class AddReactionFunction {
    async run(
        _context: FunctionContext,
        botToken: SlackBotToken,
        channelId: string,
        messageId: string,
        emoji: string
    ): Promise<boolean> {
        const client = getSlackClient(botToken);
        try {
            const result = await client.reactions.add({
                channel: channelId,
                timestamp: toMessageTs(messageId, CODE),
                name: normalizeEmojiName(emoji),
            });
            return result.ok === true;
        } catch (error) {
            throw toRuntimeError(CODE, error);
        }
    }
}
