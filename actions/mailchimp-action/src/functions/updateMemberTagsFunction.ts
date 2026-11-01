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

@Identifier("mailchimpUpdateMemberTags")
@DisplayIcon("simple:mailchimp")
@Signature("(audienceId: string, email: string, add?: string[], remove?: string[]): boolean")
@Name({code: "en-US", content: "Update member tags"})
@DisplayMessage({code: "en-US", content: "Update tags for Mailchimp member ${email}"})
@Documentation({
    code: "en-US",
    content: "Adds and/or removes tags on a member of a Mailchimp audience. Tags in `add` are set active, tags in `remove` are set inactive.",
})
@Description({
    code: "en-US",
    content: "Adds and/or removes tags on a Mailchimp audience member.",
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
@Parameter({
    runtimeName: "add",
    name: [{code: "en-US", content: "Tags to add"}],
    description: [{code: "en-US", content: "Tag names to apply to the member."}],
    optional: true,
})
@Parameter({
    runtimeName: "remove",
    name: [{code: "en-US", content: "Tags to remove"}],
    description: [{code: "en-US", content: "Tag names to remove from the member."}],
    optional: true,
})
export class UpdateMemberTagsFunction {
    async run(
        context: FunctionContext,
        audienceId: string,
        email: string,
        add?: string[],
        remove?: string[]
    ): Promise<boolean> {
        const client = getMailchimpClient(context);
        const tags = [
            ...(add ?? []).map((name) => ({name, status: "active" as const})),
            ...(remove ?? []).map((name) => ({name, status: "inactive" as const})),
        ];
        try {
            await client.lists.updateListMemberTags(audienceId, subscriberHash(email), {tags});
            return true;
        } catch (error) {
            throw toRuntimeError("MAILCHIMP_UPDATE_MEMBER_TAGS_FAILED", error);
        }
    }
}
