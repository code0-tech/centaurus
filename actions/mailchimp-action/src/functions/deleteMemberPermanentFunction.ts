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

@Identifier("mailchimpDeleteMemberPermanent")
@DisplayIcon("simple:mailchimp")
@Signature("(audienceId: string, email: string): boolean")
@Name({code: "en-US", content: "Delete member permanently"})
@DisplayMessage({code: "en-US", content: "Permanently delete Mailchimp member ${email}"})
@Documentation({
    code: "en-US",
    content:
        "Permanently erases a member of a Mailchimp audience, including their profile and campaign activity. This cannot be undone; use `mailchimpArchiveMember` for a reversible removal.",
})
@Description({
    code: "en-US",
    content: "Permanently deletes a member of a Mailchimp audience.",
})
@Parameter({
    runtimeName: "audienceId",
    name: [{code: "en-US", content: "Audience ID"}],
    description: [{code: "en-US", content: "The id of the Mailchimp audience (list) the member belongs to."}],
})
@Parameter({
    runtimeName: "email",
    name: [{code: "en-US", content: "Email"}],
    description: [{code: "en-US", content: "The member's email address."}],
})
export class DeleteMemberPermanentFunction {
    async run(context: FunctionContext, audienceId: string, email: string): Promise<boolean> {
        const client = getMailchimpClient(context);
        try {
            await client.lists.deleteListMemberPermanent(audienceId, subscriberHash(email));
            return true;
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_DELETE_MEMBER_PERMANENT_FAILED", error);
        }
    }
}
