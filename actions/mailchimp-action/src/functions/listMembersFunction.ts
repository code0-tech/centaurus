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
import {getMailchimpClient, toRuntimeError} from "../helpers.ts";
import {MailchimpMemberList, MailchimpMemberListSchema} from "../data_types/mailchimpMemberList.ts";

@Identifier("mailchimpListMembers")
@DisplayIcon("simple:mailchimp")
@Signature("(audienceId: string, status?: string, count?: number, offset?: number): MAILCHIMP_MEMBER_LIST")
@Name({code: "en-US", content: "List members"})
@DisplayMessage({code: "en-US", content: "List Mailchimp members of ${audienceId}"})
@Documentation({
    code: "en-US",
    content:
        "Lists the members of a Mailchimp audience, optionally filtered by subscription status and paginated with `count`/`offset` (defaults to Mailchimp's own defaults, 10 and 0).",
})
@Description({
    code: "en-US",
    content: "Lists the members of a Mailchimp audience.",
})
@Parameter({
    runtimeName: "audienceId",
    name: [{code: "en-US", content: "Audience ID"}],
    description: [{code: "en-US", content: "The id of the Mailchimp audience (list) to list members of."}],
})
@Parameter({
    runtimeName: "status",
    name: [{code: "en-US", content: "Status"}],
    description: [{code: "en-US", content: "Filter members by subscription status: subscribed, unsubscribed, cleaned, pending, transactional or archived."}],
    optional: true,
})
@Parameter({
    runtimeName: "count",
    name: [{code: "en-US", content: "Count"}],
    description: [{code: "en-US", content: "The number of members to return."}],
    optional: true,
})
@Parameter({
    runtimeName: "offset",
    name: [{code: "en-US", content: "Offset"}],
    description: [{code: "en-US", content: "The number of members to skip before returning results."}],
    optional: true,
})
export class ListMembersFunction {
    async run(
        context: FunctionContext,
        audienceId: string,
        status?: string,
        count?: number,
        offset?: number
    ): Promise<MailchimpMemberList> {
        const client = getMailchimpClient(context);
        try {
            // The community @types package's ListOptions omits `status`, even
            // though the SDK/API supports filtering members by it.
            const response = await client.lists.getListMembersInfo(audienceId, {status, count, offset} as any);
            return MailchimpMemberListSchema.parse(response);
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_LIST_MEMBERS_FAILED", error);
        }
    }
}
