import {DisplayMessage, Identifier, Name, Schema} from "@code0-tech/hercules";
import {z} from "zod";

// Merge fields are a free-form map keyed by the audience's merge tags
// (e.g. FNAME, LNAME, ADDRESS, PHONE, BIRTHDAY, or custom tags defined on the
// audience). Mailchimp validates the tags server-side, so this stays a loose
// record rather than a fixed shape.
export const MailchimpMergeFieldsSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));
export type MailchimpMergeFields = z.infer<typeof MailchimpMergeFieldsSchema>;

@Identifier("MAILCHIMP_MERGE_FIELDS")
@Name({code: "en-US", content: "Mailchimp merge fields"})
@DisplayMessage({code: "en-US", content: "Mailchimp merge fields"})
@Schema(MailchimpMergeFieldsSchema)
export class MailchimpMergeFieldsDataType {}
