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
import { getSlackClient, toRuntimeError, withoutUndefined } from "../helpers.js";
import { BOT_TOKEN_PARAMETER, SlackBotToken } from "../data_types/slackTokens.js";
import { SlackUser, SlackUserSchema } from "../data_types/slackUser.js";

@Identifier("slackGetUserByEmail")
@DisplayIcon("tabler:brand-slack")
@Signature("(botToken: SLACK_BOT_TOKEN, email: TEXT): SLACK_USER")
@Name({ code: "en-US", content: "Get user by email" })
@DisplayMessage({ code: "en-US", content: "Look up Slack user ${email}" })
@Documentation({
    code: "en-US",
    content:
        "Looks a workspace member up by email address via `users.lookupByEmail`.\nUse it to get a member's profile, e.g. their name or time zone. `slackSendDirectMessage` and `slackInviteToChannel` accept an email address directly. Requires the `users:read.email` scope.",
})
@Description({ code: "en-US", content: "Looks up a Slack user by their email address." })
@Parameter(BOT_TOKEN_PARAMETER)
@Parameter({
    runtimeName: "email",
    name: [{ code: "en-US", content: "Email" }],
    description: [{ code: "en-US", content: "The email address of the workspace member to look up." }],
})
export class GetUserByEmailFunction {
    async run(_context: FunctionContext, botToken: SlackBotToken, email: string): Promise<SlackUser> {
        const client = getSlackClient(botToken);
        try {
            const result = await client.users.lookupByEmail({ email });
            if (!result.user) {
                throw new RuntimeError("SLACK_GET_USER_BY_EMAIL_FAILED", `Slack did not return a user for ${email}.`);
            }
            return withoutUndefined(SlackUserSchema.parse(result.user));
        } catch (error) {
            throw toRuntimeError("SLACK_GET_USER_BY_EMAIL_FAILED", error);
        }
    }
}
