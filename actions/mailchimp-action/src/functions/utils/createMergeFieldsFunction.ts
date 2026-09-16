import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import {MailchimpMergeFields} from "../../data_types/mailchimpMergeFields.ts";

@Identifier("mailchimpCreateMergeFields")
@Signature("(FirstName?: string, LastName?: string, Address?: string, Phone?: string, Birthday?: string): MAILCHIMP_MERGE_FIELDS")
@Name({code: "en-US", content: "Create Mailchimp merge fields"})
@DisplayIcon("simple:mailchimp")
@DisplayMessage({code: "en-US", content: "Create Mailchimp merge fields"})
@Documentation({
    code: "en-US",
    content:
        "Builds a `MAILCHIMP_MERGE_FIELDS` object from Mailchimp's common built-in merge tags (FNAME, LNAME, ADDRESS, PHONE, BIRTHDAY) for use with `mailchimpAddOrUpdateMember`. Omitted values are left out of the resulting object.",
})
@Description({code: "en-US", content: "Creates a Mailchimp merge fields object which can be used when adding or updating a member."})
@Parameter({
    runtimeName: "FirstName",
    name: [{code: "en-US", content: "First name"}],
    description: [{code: "en-US", content: "Maps to the FNAME merge tag."}],
    optional: true,
})
@Parameter({
    runtimeName: "LastName",
    name: [{code: "en-US", content: "Last name"}],
    description: [{code: "en-US", content: "Maps to the LNAME merge tag."}],
    optional: true,
})
@Parameter({
    runtimeName: "Address",
    name: [{code: "en-US", content: "Address"}],
    description: [{code: "en-US", content: "Maps to the ADDRESS merge tag."}],
    optional: true,
})
@Parameter({
    runtimeName: "Phone",
    name: [{code: "en-US", content: "Phone"}],
    description: [{code: "en-US", content: "Maps to the PHONE merge tag."}],
    optional: true,
})
@Parameter({
    runtimeName: "Birthday",
    name: [{code: "en-US", content: "Birthday"}],
    description: [{code: "en-US", content: "Maps to the BIRTHDAY merge tag."}],
    optional: true,
})
export class CreateMergeFieldsFunction {
    run(
        _context: unknown,
        FirstName?: string,
        LastName?: string,
        Address?: string,
        Phone?: string,
        Birthday?: string
    ): MailchimpMergeFields {
        const mergeFields: MailchimpMergeFields = {};
        if (FirstName !== undefined) mergeFields.FNAME = FirstName;
        if (LastName !== undefined) mergeFields.LNAME = LastName;
        if (Address !== undefined) mergeFields.ADDRESS = Address;
        if (Phone !== undefined) mergeFields.PHONE = Phone;
        if (Birthday !== undefined) mergeFields.BIRTHDAY = Birthday;
        return mergeFields;
    }
}
