import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A Slack workspace member.
 * See https://docs.slack.dev/reference/objects/user-object
 */
export const SlackUserSchema = z.object({
    id: z.string().describe("The user ID, e.g. U0123456789."),
    team_id: z.string().nullish().describe("The ID of the workspace the user belongs to."),
    name: z.string().nullish().describe("The user's workspace handle without the leading @."),
    real_name: z.string().nullish().describe("The user's full name."),
    tz: z.string().nullish().describe("The user's timezone, e.g. Europe/Berlin."),
    is_admin: z.boolean().nullish().describe("Whether the user is a workspace admin."),
    is_owner: z.boolean().nullish().describe("Whether the user is the workspace owner."),
    is_bot: z.boolean().nullish().describe("Whether the user is a bot."),
    deleted: z.boolean().nullish().describe("Whether the user account has been deactivated."),
    profile: z
        .object({
            real_name: z.string().nullish().describe("The user's full name."),
            display_name: z.string().nullish().describe("The name the user chose to display."),
            email: z.string().nullish().describe("The user's email address. Requires the users:read.email scope."),
            title: z.string().nullish().describe("The user's job title."),
            phone: z.string().nullish().describe("The user's phone number."),
            status_text: z.string().nullish().describe("The user's custom status text."),
            status_emoji: z.string().nullish().describe("The emoji of the user's custom status."),
            image_512: z.string().nullish().describe("The URL of the user's 512x512 profile picture."),
        })
        .nullish()
        .describe("The user's profile."),
});
export type SlackUser = z.infer<typeof SlackUserSchema>;

@Identifier("SLACK_USER")
@Name({ code: "en-US", content: "Slack user" })
@DisplayMessage({ code: "en-US", content: "Slack user" })
@Schema(SlackUserSchema)
export class SlackUserDataType {}
