import { FunctionContext, RuntimeError } from "@code0-tech/hercules";
import axios from "axios";
import { z } from "zod";
import { TwilioMessage, TwilioMessageSchema } from "./data_types/twilioMessage.js";

const DEFAULT_BASE_URL = "https://api.twilio.com";

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
 * Sends a message through the Twilio Messages API.
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

    const baseUrl = (context.matchedConfig.findConfig("base_url") as string) || DEFAULT_BASE_URL;

    const body = new URLSearchParams();
    body.set("To", parsed.To);
    body.set("From", from);
    body.set("Body", parsed.Body);
    if (parsed.MediaUrl) {
        body.set("MediaUrl", parsed.MediaUrl);
    }

    try {
        const result = await axios.post(
            `${baseUrl}/2010-04-01/Accounts/${accountSid}/Messages.json`,
            body,
            {
                auth: { username: accountSid, password: authToken },
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );
        return TwilioMessageSchema.parse(result.data);
    } catch (error: any) {
        const twilioError = error.response?.data;
        if (twilioError?.message) {
            console.error("Error sending message to Twilio API:", twilioError.code, twilioError.message);
            throw new RuntimeError(
                "ERROR_SENDING_TWILIO_MESSAGE",
                `Twilio API error ${twilioError.code ?? ""}: ${twilioError.message}`
            );
        }
        if (error instanceof Error) {
            throw new RuntimeError("ERROR_SENDING_TWILIO_MESSAGE", error.message);
        }
        throw new RuntimeError("ERROR_SENDING_TWILIO_MESSAGE", "An error occurred while sending the Twilio message.");
    }
};
