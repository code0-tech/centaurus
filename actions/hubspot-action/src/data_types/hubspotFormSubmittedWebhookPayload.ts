import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * Body of a HubSpot form-submission webhook. HubSpot has no app webhook
 * subscription for form submissions, so this is sent by a HubSpot workflow
 * ("Form submission" enrollment trigger + "Send a webhook" action). The body
 * depends on how the workflow action is configured, so every field is
 * optional: the form/page metadata, the submitted field values, and/or the
 * enrolled contact's properties.
 */
export const HubSpotFormSubmittedWebhookPayloadSchema = z.object({
    portalId: z.number().optional().describe("The HubSpot account (portal) id."),
    formId: z.string().optional().describe("The id (GUID) of the submitted form."),
    objectId: z.number().optional().describe("The id of the contact created or updated by the submission."),
    submittedAt: z.number().optional().describe("Submission time in epoch milliseconds."),
    pageUrl: z.string().optional().describe("The URL of the page the form was submitted on."),
    pageName: z.string().optional().describe("The title of the page the form was submitted on."),
    values: z
        .array(z.object({ name: z.string(), value: z.string() }))
        .optional()
        .describe("The submitted form fields."),
    properties: z
        .record(z.string(), z.string().nullable())
        .optional()
        .describe("Properties of the enrolled contact, if the workflow sends them."),
});
export type HubSpotFormSubmittedWebhookPayload = z.infer<typeof HubSpotFormSubmittedWebhookPayloadSchema>;

@Identifier("HubSpotFormSubmittedWebhookPayload")
@Name({ code: "en-US", content: "HubSpot form submitted webhook payload" })
@Schema(HubSpotFormSubmittedWebhookPayloadSchema)
export class HubSpotFormSubmittedWebhookPayloadDataType {}
