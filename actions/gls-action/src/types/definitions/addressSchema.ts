import z from "zod"

export const AddressSchema = z.object({
    Name1: z.string().max(40),
    Name2: z.string().max(40).optional(),
    Name3: z.string().max(40).optional(),
    CountryCode: z.string().max(2),
    Province: z.string().max(40).optional(),
    City: z.string().max(40),
    Street: z.string().min(4),
    StreetNumber: z.string().max(40).optional(),
    ContactPerson: z.string().max(40).min(6).optional(),
    FixedLinePhonenumber: z.string().max(35).min(4).optional(),
    MobilePhonenumber: z.string().max(35).min(4).optional(),
    eMail: z.string().max(80).optional(),
    ZIPCode: z.string().max(10),
})
export type AddressSchema = z.infer<typeof AddressSchema>