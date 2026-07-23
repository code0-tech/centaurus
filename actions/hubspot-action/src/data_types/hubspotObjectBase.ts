import { z } from "zod";

/**
 * Base shape shared by all HubSpot CRM objects returned by the official
 * `@hubspot/api-client` SDK (its `SimplePublicObject`): a stable `id`, a flat
 * bag of string `properties`, lifecycle timestamps, and an `archived` flag.
 *
 * HubSpot CRM objects (contacts, deals, companies, notes, ...) all share this
 * envelope and differ only in which property keys are populated, so we model
 * the SDK's response type once and reuse it for every object data type rather
 * than duplicating a near-identical schema per object.
 */
export const hubSpotObjectSchema = () =>
    z.object({
        id: z.string().describe("The unique HubSpot object id."),
        properties: z
            .record(z.string(), z.string().nullable())
            .describe("Flat map of HubSpot property names to their (string) values."),
        createdAt: z.string().nullable().optional().describe("ISO-8601 creation timestamp."),
        updatedAt: z.string().nullable().optional().describe("ISO-8601 last-update timestamp."),
        archived: z.boolean().nullable().optional().describe("Whether the object is archived."),
    });

export type HubSpotObject = z.infer<ReturnType<typeof hubSpotObjectSchema>>;
