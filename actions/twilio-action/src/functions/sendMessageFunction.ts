import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { sendMessage } from "../helpers.js";
import { TwilioMessage } from "../data_types/twilioMessage.js";

@Identifier("sendMessage")
@DisplayIcon("tabler:message")
@Signature("(ToPhoneNumber: string, Body: string, FromPhoneNumber?: string, MediaUrl?: string): TWILIO_MESSAGE")
@Name({ code: "en-US", content: "Send message" })
@DisplayMessage({ code: "en-US", content: "Send message to ${ToPhoneNumber}" })
@Documentation({
    code: "en-US",
    content:
        "Sends an SMS, MMS, or channel message (e.g. WhatsApp) through the Twilio Messages API.\nProvide `From` to override the action's default sender, and `MediaUrl` to send an MMS.",
})
@Description({
    code: "en-US",
    content: "Sends an SMS, MMS, or channel message through the Twilio Messages API.",
})
@Parameter({
    runtimeName: "ToPhoneNumber",
    name: [{ code: "en-US", content: "To" }],
    description: [
        { code: "en-US", content: "The destination phone number in E.164 format or channel address (e.g. whatsapp:+1...)." },
    ],
})
@Parameter({
    runtimeName: "Body",
    name: [{ code: "en-US", content: "Body" }],
    description: [{ code: "en-US", content: "The text of the message to send. Up to 1600 characters." }],
})
@Parameter({
    runtimeName: "FromPhoneNumber",
    name: [{ code: "en-US", content: "From" }],
    description: [
        {
            code: "en-US",
            content:
                "The Twilio sender (phone number, short code, or channel address). Falls back to the configured default sender when omitted.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "MediaUrl",
    name: [{ code: "en-US", content: "Media URL" }],
    description: [{ code: "en-US", content: "The URL of a media file to attach to the message (MMS)." }],
    optional: true,
})
export class SendMessageFunction {
    async run(
        context: FunctionContext,
        ToPhoneNumber: string,
        Body: string,
        FromPhoneNumber?: string,
        MediaUrl?: string
    ): Promise<TwilioMessage> {
        try {
            return await sendMessage({ To: ToPhoneNumber, Body, From: FromPhoneNumber, MediaUrl }, context);
        } catch (error) {
            if (error instanceof RuntimeError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new RuntimeError("ERROR_SENDING_TWILIO_MESSAGE", error.message);
            }
            throw new RuntimeError(
                "ERROR_SENDING_TWILIO_MESSAGE",
                "An error occurred while sending the Twilio message."
            );
        }
    }
}
