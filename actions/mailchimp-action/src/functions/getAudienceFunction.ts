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
import {MailchimpAudience, MailchimpAudienceSchema} from "../data_types/mailchimpAudience.ts";

@Identifier("mailchimpGetAudience")
@DisplayIcon("simple:mailchimp")
@Signature("(audienceId: string): MAILCHIMP_AUDIENCE")
@Name({code: "en-US", content: "Get audience"})
@DisplayMessage({code: "en-US", content: "Get Mailchimp audience ${audienceId}"})
@Documentation({
    code: "en-US",
    content: "Retrieves details and stats for a Mailchimp audience (list).",
})
@Description({
    code: "en-US",
    content: "Retrieves a Mailchimp audience by id.",
})
@Parameter({
    runtimeName: "audienceId",
    name: [{code: "en-US", content: "Audience ID"}],
    description: [{code: "en-US", content: "The id of the Mailchimp audience (list) to retrieve."}],
})
export class GetAudienceFunction {
    async run(context: FunctionContext, audienceId: string): Promise<MailchimpAudience> {
        const client = getMailchimpClient(context);
        try {
            // The community @types package omits `lists.getList`, even though
            // the SDK implements it (GET /lists/{list_id}).
            const audience = await (client.lists as unknown as {getList(listId: string): Promise<unknown>}).getList(
                audienceId
            );
            return MailchimpAudienceSchema.parse(audience);
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_GET_AUDIENCE_FAILED", error);
        }
    }
}
