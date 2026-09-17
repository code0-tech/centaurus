import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";
import {MailchimpMemberSchema} from "./mailchimpMember.ts";

// See https://mailchimp.com/developer/marketing/api/list-members/list-members-info/
export const MailchimpMemberListSchema = z.object({
    members: z.array(MailchimpMemberSchema),
    list_id: z.string().optional().describe("The audience (list) id these members belong to."),
    total_items: z.number().optional().describe("The total number of items matching the query, regardless of pagination."),
});
export type MailchimpMemberList = z.infer<typeof MailchimpMemberListSchema>;

@Identifier("MAILCHIMP_MEMBER_LIST")
@Name({code: "en-US", content: "Mailchimp member list"})
@DisplayMessage({code: "en-US", content: "${total_items} Mailchimp members"})
@Schema(MailchimpMemberListSchema)
export class MailchimpMemberListDataType {}
