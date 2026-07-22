import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * Represents a Twilio Message resource as returned by the Messages API.
 * See https://www.twilio.com/docs/messaging/api/message-resource
 */
export const TwilioMessageSchema = z.object({
    sid: z.string().describe("The unique string that identifies the message resource."),
    account_sid: z.string().describe("The SID of the Account that created the message resource."),
    messaging_service_sid: z
        .string()
        .nullish()
        .describe("The SID of the Messaging Service used, if the message was sent through one."),
    from: z
        .string()
        .nullish()
        .describe("The sender's phone number, short code, or channel address (e.g. whatsapp:+1...)."),
    to: z.string().describe("The recipient's phone number, short code, or channel address."),
    body: z.string().nullish().describe("The text body of the message. Up to 1600 characters long."),
    status: z
        .string()
        .describe(
            "The status of the message. Common values: accepted, scheduled, queued, sending, sent, receiving, received, delivered, undelivered, failed, read, canceled."
        ),
    direction: z
        .string()
        .describe("The direction of the message: inbound, outbound-api, outbound-call, or outbound-reply."),
    num_segments: z.string().nullish().describe("The number of segments that make up the complete message."),
    num_media: z.string().nullish().describe("The number of media files associated with the message."),
    price: z.string().nullish().describe("The amount billed for the message, in the currency specified by price_unit."),
    price_unit: z.string().nullish().describe("The currency in which price is measured, in ISO 4127 format (e.g. USD)."),
    error_code: z.number().nullish().describe("The error code returned if the message status is failed or undelivered."),
    error_message: z.string().nullish().describe("A human-readable description of the error_code, if any."),
    date_created: z.string().nullish().describe("The date and time the message was created, in RFC 2822 format."),
    date_updated: z.string().nullish().describe("The date and time the message was last updated, in RFC 2822 format."),
    date_sent: z.string().nullish().describe("The date and time the message was sent, in RFC 2822 format."),
    api_version: z.string().nullish().describe("The version of the Twilio API used to process the message."),
    uri: z.string().nullish().describe("The URI of the message resource, relative to https://api.twilio.com."),
});
export type TwilioMessage = z.infer<typeof TwilioMessageSchema>;

@Identifier("TWILIO_MESSAGE")
@Name({ code: "en-US", content: "Twilio message" })
@DisplayMessage({ code: "en-US", content: "Twilio message" })
@Schema(TwilioMessageSchema)
export class TwilioMessageDataType {}
