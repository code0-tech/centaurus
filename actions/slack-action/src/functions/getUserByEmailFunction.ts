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
import { SlackUser, SlackUserSchema } from "../data_types/slackUser.js";

@Identifier("slackGetUserByEmail")
@DisplayIcon("simple:slack")
@Signature("(email: TEXT): SLACK_USER")
@Name({ code: "en-US", content: "Get user by email" })
@DisplayMessage({ code: "en-US", content: "Look up Slack user ${email}" })
@Documentation({
    code: "en-US",
    content:
        "Looks a workspace member up by email address via `users.lookupByEmail`.\nThis is the bridge from records in other systems (a Shopify customer, a support ticket assignee) to a Slack user ID usable with `slackSendDirectMessage` or `slackInviteToChannel`. Requires the `users:read.email` scope.",
})
@Description({ code: "en-US", content: "Looks up a Slack user by their email address." })
@Parameter({
    runtimeName: "email",
    name: [{ code: "en-US", content: "Email" }],
    description: [{ code: "en-US", content: "The email address of the workspace member to look up." }],
})
export class GetUserByEmailFunction {
    async run(context: FunctionContext, email: string): Promise<SlackUser> {
        const client = getSlackClient(context);
        try {
            const result = await client.users.lookupByEmail({ email });
            if (!result.user) {
                throw new RuntimeError("SLACK_GET_USER_BY_EMAIL_FAILED", `Slack did not return a user for ${email}.`);
            }
            return SlackUserSchema.parse(result.user);
        } catch (error) {
            throw toRuntimeError("SLACK_GET_USER_BY_EMAIL_FAILED", error);
        }
    }
}
