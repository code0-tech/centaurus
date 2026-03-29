import {ActionSdk} from "@code0-tech/hercules";
import z from "zod"
import {singleZodSchemaToTypescriptDef} from "../helpers";

export const AddressSchema = z.object({
    Name1: z.string().max(40).describe(`
    Primary name line (person or company).
    Max 40 characters.
    `),
    Name2: z.string().max(40).optional().describe(`
    Optional second name line (e.g., department or additional identifier).
    Max 40 characters.
    `),    Name3: z.string().max(40).optional().describe(`
    Optional third name line for extended address details.
    Max 40 characters.
    `),
    CountryCode: z.string().max(2).describe(`
    Two-letter ISO country code (e.g., DE, US).
    `),
    Province: z.string().max(40).optional().describe(`
    State, province, or region.
    Optional field.
    Max 40 characters.
    `),
    City: z.string().max(40).describe(`
    City or locality name.
    Max 40 characters.
    `),
    Street: z.string().min(4).describe(`
    Street name.
    Minimum 4 characters required.
    `),
    StreetNumber: z.string().max(40).optional().describe(`
    House or building number.
    Optional field.
    Max 40 characters.
    `),
    ContactPerson: z.string().max(40).min(6).optional().describe(`
    Full name of a contact person.
    Optional field.
    Must be between 6 and 40 characters.
    `),
    FixedLinePhonenumber: z.string().max(35).min(4).optional().describe(`
    Landline phone number.
    Optional field.
    Must be between 4 and 35 characters.
    `),
    MobilePhonenumber: z.string().max(35).min(4).optional().describe(`
    Mobile phone number.
    Optional field.
    Must be between 4 and 35 characters.
    `),
    eMail: z.string().max(80).optional().describe(`
    Email address.
    Optional field.
    Max 80 characters.
    `),
    ZIPCode: z.string().max(10).describe(`
    Postal or ZIP code.
    Max 10 characters.
    `),
})
export type AddressSchema = z.infer<typeof AddressSchema>


export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_ADDRESS",
            type: singleZodSchemaToTypescriptDef("GLS_ADDRESS", AddressSchema),
            name: [
                {
                    code: "en-US",
                    content: "Address"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Address"
                }
            ]
        },
    )
}