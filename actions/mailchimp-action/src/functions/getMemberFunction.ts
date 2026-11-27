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

@Identifier("mailchimpGetMember")
@DisplayIcon("simple:mailchimp")
@Signature("(audienceId: string, email: string): MAILCHIMP_MEMBER")
@Name({code: "en-US", content: "Get member"})
@DisplayMessage({code: "en-US", content: "Get Mailchimp member ${email}"})
@Documentation({
    code: "en-US",
    content: "Looks up a member of a Mailchimp audience by email address.",
})
@Description({
    code: "en-US",
    content: "Retrieves a member of a Mailchimp audience by email address.",
})
@Parameter({
    runtimeName: "audienceId",
    name: [{code: "en-US", content: "Audience ID"}],
    description: [{code: "en-US", content: "The id of the Mailchimp audience (list) to look the member up in."}],
})
@Parameter({
    runtimeName: "email",
    name: [{code: "en-US", content: "Email"}],
    description: [{code: "en-US", content: "The member's email address."}],
})
export class GetMemberFunction {
    async run(context: FunctionContext, audienceId: string, email: string): Promise<MailchimpMember> {
        const client = getMailchimpClient(context);
        try {
            const member = await client.lists.getListMember(audienceId, subscriberHash(email));
            return MailchimpMemberSchema.parse(member);
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_GET_MEMBER_FAILED", error);
        }
    }
}
