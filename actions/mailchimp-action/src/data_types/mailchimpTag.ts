import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

export const MailchimpTagSchema = z.object({
    id: z.number().optional().describe("The tag's numeric id."),
    name: z.string().describe("The tag's name."),
});
export type MailchimpTag = z.infer<typeof MailchimpTagSchema>;

@Identifier("MAILCHIMP_TAG")
@Name({code: "en-US", content: "Mailchimp tag"})
@DisplayMessage({code: "en-US", content: "Mailchimp tag ${name}"})
@Schema(MailchimpTagSchema)
export class MailchimpTagDataType {}
