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

@Identifier("mailchimpArchiveMember")
@DisplayIcon("simple:mailchimp")
@Signature("(audienceId: string, email: string): boolean")
@Name({code: "en-US", content: "Archive member"})
@DisplayMessage({code: "en-US", content: "Archive Mailchimp member ${email}"})
@Documentation({
    code: "en-US",
    content:
        "Archives a member of a Mailchimp audience. Archived members are removed from the audience but their data is kept and can be restored by re-adding them; use `mailchimpDeleteMemberPermanent` to erase them entirely.",
})
@Description({
    code: "en-US",
    content: "Archives a member of a Mailchimp audience.",
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
export class ArchiveMemberFunction {
    async run(context: FunctionContext, audienceId: string, email: string): Promise<boolean> {
        const client = getMailchimpClient(context);
        try {
            await client.lists.deleteListMember(audienceId, subscriberHash(email));
            return true;
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_ARCHIVE_MEMBER_FAILED", error);
        }
    }
}
