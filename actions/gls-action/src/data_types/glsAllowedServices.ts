import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AllowedServicesRequestDataSchema = z.object({
    Source: z.object({
        CountryCode: z.string().max(2),
        ZIPCode: z.string().max(10),
    }),
    Destination: z.object({
        CountryCode: z.string().max(2),
        ZIPCode: z.string().max(10),
    }),
    ContactID: z.string().optional(),
});
export type AllowedServicesRequestData = z.infer<typeof AllowedServicesRequestDataSchema>;

export const AllowedServicesResponseDataSchema = z.object({
    AllowedServices: z.array(
        z.object({
            ServiceName: z.string().optional(),
            ProductName: z.string().optional(),
        })
    ),
});
export type AllowedServicesResponseData = z.infer<typeof AllowedServicesResponseDataSchema>;

@Identifier("GLS_ALLOWED_SERVICES_REQUEST_DATA")
@Name({ code: "en-US", content: "Allowed services request data" })
@DisplayMessage({ code: "en-US", content: "Allowed services request data" })
@Schema(AllowedServicesRequestDataSchema)
export class GlsAllowedServicesRequestDataType {}

@Identifier("GLS_ALLOWED_SERVICES_RESPONSE_DATA")
@Name({ code: "en-US", content: "Allowed services response data" })
@DisplayMessage({ code: "en-US", content: "Allowed services response data" })
@Schema(AllowedServicesResponseDataSchema)
export class GlsAllowedServicesResponseDataType {}
