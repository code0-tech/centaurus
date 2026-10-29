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
import {getMailchimpClient, subscriberHash, toRuntimeError} from "../helpers.ts";
import {MailchimpMember, MailchimpMemberSchema} from "../data_types/mailchimpMember.ts";
import {MailchimpMergeFields} from "../data_types/mailchimpMergeFields.ts";

@Identifier("mailchimpAddOrUpdateMember")
@DisplayIcon("simple:mailchimp")
@Signature("(audienceId: string, email: string, status: \"subscribed\"|\"unsubscribed\"|\"cleaned\"|\"pending\"|\"transactional\", mergeFields?: MAILCHIMP_MERGE_FIELDS): MAILCHIMP_MEMBER")
@Name({code: "en-US", content: "Add or update member"})
@DisplayMessage({code: "en-US", content: "Add or update Mailchimp member ${email}"})
@Documentation({
    code: "en-US",
    content:
        "Adds a new member to an audience or updates an existing one, keyed by email address (an upsert via PUT /lists/{list_id}/members/{subscriber_hash}). Valid `status` values are subscribed, unsubscribed, cleaned, pending and transactional.",
})
@Description({
    code: "en-US",
    content: "Adds a member to a Mailchimp audience, or updates them if they already exist.",
})
@Parameter({
    runtimeName: "audienceId",
    name: [{code: "en-US", content: "Audience ID"}],
    description: [{code: "en-US", content: "The id of the Mailchimp audience (list) to add or update the member in."}],
})
@Parameter({
    runtimeName: "email",
    name: [{code: "en-US", content: "Email"}],
    description: [{code: "en-US", content: "The member's email address."}],
})
@Parameter({
    runtimeName: "status",
    name: [{code: "en-US", content: "Status"}],
    description: [
        {code: "en-US", content: "The member's subscription status: subscribed, unsubscribed, cleaned, pending or transactional."},
    ],
})
@Parameter({
    runtimeName: "mergeFields",
    name: [{code: "en-US", content: "Merge fields"}],
    description: [{code: "en-US", content: "Merge field values (e.g. FNAME, LNAME) to set on the member."}],
    optional: true,
})
export class AddOrUpdateMemberFunction {
    async run(
        context: FunctionContext,
        audienceId: string,
        email: string,
        status: "subscribed" | "unsubscribed" | "cleaned" | "pending" | "transactional",
        mergeFields?: MailchimpMergeFields
    ): Promise<MailchimpMember> {
        const client = getMailchimpClient(context);
        try {
            const member = await client.lists.setListMember(audienceId, subscriberHash(email), {
                email_address: email,
                status_if_new: status,
                status,
                merge_fields: mergeFields,
            });
            return MailchimpMemberSchema.parse(member);
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_ADD_OR_UPDATE_MEMBER_FAILED", error);
        }
    }
}
