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