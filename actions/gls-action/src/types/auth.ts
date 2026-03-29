import z from "zod";

export const AuthenticationRequestDataSchema = z.object({
    grant_type: z.string().default("client_credentials"),
    client_id: z.string(),
    client_secret: z.string(),
    scope: z.string().optional()
})
export type AuthenticationRequestData = z.infer<typeof AuthenticationRequestDataSchema>
export const AuthenticationResponseDataSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
})
export type AuthenticationResponseData = z.infer<typeof AuthenticationResponseDataSchema>