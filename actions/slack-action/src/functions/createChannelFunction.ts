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
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { parseSlackChannel, SlackChannel } from "../data_types/slackChannel.js";

const CODE = "SLACK_CREATE_CHANNEL_FAILED";
const MAX_CHANNEL_NAME_LENGTH = 80;

/**
 * Slack only accepts lowercase channel names of at most 80 characters made of
 * letters, digits, hyphens and underscores. Turn whatever the user typed
 * (`#Release Planning Q3!`) into such a name (`release-planning-q3`):
 * drop a leading #, strip diacritics, lowercase, and collapse every run of
 * other characters into a single hyphen.
 */
export function normalizeChannelName(name: string): string {
    return name
        .trim()
        .replace(/^#+/, "")
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .replace(/ß/g, "ss")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, MAX_CHANNEL_NAME_LENGTH)
        .replace(/-+$/, "");
}

@Identifier("slackCreateChannel")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, name: TEXT, isPrivate?: BOOLEAN): SLACK_CHANNEL")
@Name({ code: "en-US", content: "Create channel" })
@DisplayMessage({ code: "en-US", content: "Create Slack channel #${name}" })
@Documentation({
    code: "en-US",
    content:
        "Creates a channel via `conversations.create`.\nSlack channel names are lowercase, max 80 characters, and may only contain letters, digits, hyphens and underscores. The creating app becomes a member, so it can post right away.",
})
@Description({ code: "en-US", content: "Creates a Slack channel." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "name",
    name: [{ code: "en-US", content: "Name" }],
    description: [
        {
            code: "en-US",
            content: "The channel name. Any text is accepted and converted to a valid Slack channel name.",
        },
    ],
})
@Parameter({
    runtimeName: "isPrivate",
    name: [{ code: "en-US", content: "Private" }],
    description: [{ code: "en-US", content: "Whether to create a private channel. Defaults to a public channel." }],
    optional: true,
})
export class CreateChannelFunction {
    async run(_context: FunctionContext, botToken: SlackBotToken, name: string, isPrivate?: boolean): Promise<SlackChannel> {
        const channelName = normalizeChannelName(name);
        if (!channelName) {
            throw new RuntimeError(CODE, `"${name}" does not contain any characters usable in a Slack channel name.`);
        }
        const client = getSlackClient(botToken);
        try {
            const result = await client.conversations.create({ name: channelName, is_private: isPrivate ?? false });
            if (!result.channel) {
                throw new RuntimeError(CODE, `Slack did not return a channel for ${channelName}.`);
            }
            return parseSlackChannel(result.channel);
        } catch (error) {
            throw toRuntimeError(CODE, error);
        }
    }
}
