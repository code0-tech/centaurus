import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../src/helpers";
import z from "zod";

export const AllowedServicesRequestDataSchema = z.object({
    Source: z.object({
        CountryCode: z.string().max(2),
        ZIPCode: z.string().max(10)
    }),
    Destination: z.object({
        CountryCode: z.string().max(2),
        ZIPCode: z.string().max(10)
    }),
    ContactID: z.string().optional()
})
export type AllowedServicesRequestData = z.infer<typeof AllowedServicesRequestDataSchema>
export const AllowedServicesResponseDataSchema = z.object({
    AllowedServices: z.array(z.union([
        z.object({
            ServiceName: z.string(),
        }).strict(),
        z.object({
            ProductName: z.string(),
        }).strict()
    ]))
})
export type AllowedServicesResponseData = z.infer<typeof AllowedServicesResponseDataSchema>

export default (sdk: ActionSdk) => {

    return sdk.registerDataTypes(
        {
            identifier: "GLS_ALLOWED_SERVICES_REQUEST_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_ALLOWED_SERVICES_REQUEST_DATA",
                AllowedServicesRequestDataSchema,
            ),
            name: [
                {
                    code: "en-US",
                    content: "Allowed services request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Allowed services request data"
                }
            ]
        },
        {
            identifier: "GLS_ALLOWED_SERVICES_RESPONSE_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_ALLOWED_SERVICES_RESPONSE_DATA",
                AllowedServicesResponseDataSchema,
            ),
            name: [
                {
                    code: "en-US",
                    content: "Allowed services response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Allowed services response data"
                }
            ]
        },
    )
}
