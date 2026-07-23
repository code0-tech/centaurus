import { FunctionContext, RuntimeError } from "@code0-tech/hercules";
import twilio from "twilio";
import { z } from "zod";
import { TwilioMessage, TwilioMessageSchema } from "./data_types/twilioMessage.js";

export const SendMessageRequestDataSchema = z.object({
    To: z.string().describe("The destination phone number or channel address (e.g. whatsapp:+1...)."),
    Body: z.string().describe("The text of the message to send. Up to 1600 characters."),
    From: z
        .string()
        .optional()
        .describe("The Twilio sender. Falls back to the configured default sender when omitted."),
    MediaUrl: z.string().optional().describe("The URL of a media file to attach to the message (MMS)."),
});
export type SendMessageRequestData = z.infer<typeof SendMessageRequestDataSchema>;

/**
 * Resolves the Twilio Account SID and Auth Token from the matched action config.
 */
function getCredentials(context: FunctionContext): { accountSid: string; authToken: string } {
    const accountSid = context.matchedConfig.findConfig("account_sid") as string;
    const authToken = context.matchedConfig.findConfig("auth_token") as string;

    if (!accountSid || !authToken) {
        throw new RuntimeError(
            "MISSING_TWILIO_CREDENTIALS",
            "Twilio account_sid and auth_token must be configured for this action."
        );
    }

    return { accountSid, authToken };
}

/**
 * Sends a message through the Twilio Messages API using the official Twilio SDK.
 * See https://www.twilio.com/docs/messaging/api/message-resource#create-a-message-resource
 */
export const sendMessage = async (
    data: SendMessageRequestData,
    context: FunctionContext
): Promise<TwilioMessage> => {
    const parsed = SendMessageRequestDataSchema.parse(data);
    const { accountSid, authToken } = getCredentials(context);

    const from = parsed.From || ((context.matchedConfig.findConfig("from_number") as string) ?? "");
    if (!from) {
        throw new RuntimeError(
            "MISSING_TWILIO_SENDER",
            "No sender provided. Pass a From value or configure a default from_number for the action."
        );
    }

    const client = twilio(accountSid, authToken);

    try {
        const message = await client.messages.create({
            to: parsed.To,
            from,
            body: parsed.Body,
            ...(parsed.MediaUrl ? { mediaUrl: [parsed.MediaUrl] } : {}),
        });

        return TwilioMessageSchema.parse({
            sid: message.sid,
            account_sid: message.accountSid,
            messaging_service_sid: message.messagingServiceSid,
            from: message.from,
            to: message.to,
            body: message.body,
            status: message.status,
            direction: message.direction,
            num_segments: message.numSegments,
            num_media: message.numMedia,
            price: message.price,
            price_unit: message.priceUnit,
            error_code: message.errorCode,
            error_message: message.errorMessage,
            date_created: message.dateCreated ? message.dateCreated.toUTCString() : null,
            date_updated: message.dateUpdated ? message.dateUpdated.toUTCString() : null,
            date_sent: message.dateSent ? message.dateSent.toUTCString() : null,
            api_version: message.apiVersion,
            uri: message.uri,
        });
    } catch (error: any) {
        // Twilio's RestException exposes a numeric `code` and a human-readable `message`.
        if (error?.code || error?.message) {
            console.error("Error sending message to Twilio API:", error.code, error.message);
            throw new RuntimeError(
                "ERROR_SENDING_TWILIO_MESSAGE",
                `Twilio API error ${error.code ?? ""}: ${error.message ?? "unknown error"}`
            );
        }
        throw new RuntimeError("ERROR_SENDING_TWILIO_MESSAGE", "An error occurred while sending the Twilio message.");
    }
};
