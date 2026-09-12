import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { toRuntimeError, verifyRequestSignature } from "../helpers.js";

@Identifier("slackVerifyRequestSignature")
@DisplayIcon("simple:slack")
@Signature("(signature: TEXT, timestamp: TEXT, rawBody: TEXT): BOOLEAN")
@Name({ code: "en-US", content: "Verify request signature" })
@DisplayMessage({ code: "en-US", content: "Verify Slack request signature" })
@Documentation({
    code: "en-US",
    content:
        "Verifies that an inbound Slack request really came from Slack, by recomputing the `X-Slack-Signature` HMAC over `v0:<timestamp>:<rawBody>` with the configured signing secret. Requests whose `X-Slack-Request-Timestamp` is more than five minutes old are rejected as replays.\nSlack signs the exact bytes it sent, so `rawBody` must be the unparsed request body — a re-serialized payload will not reproduce the signature. See the action README for how this interacts with the webhook events.",
})
@Description({ code: "en-US", content: "Verifies the signature of an inbound Slack request." })
@Parameter({
    runtimeName: "signature",
    name: [{ code: "en-US", content: "Signature" }],
    description: [{ code: "en-US", content: "The value of the request's X-Slack-Signature header (v0=...)." }],
})
@Parameter({
    runtimeName: "timestamp",
    name: [{ code: "en-US", content: "Timestamp" }],
    description: [{ code: "en-US", content: "The value of the request's X-Slack-Request-Timestamp header." }],
})
@Parameter({
    runtimeName: "rawBody",
    name: [{ code: "en-US", content: "Raw body" }],
    description: [{ code: "en-US", content: "The unparsed request body exactly as Slack sent it." }],
})
export class VerifyRequestSignatureFunction {
    run(context: FunctionContext, signature: string, timestamp: string, rawBody: string): boolean {
        try {
            return verifyRequestSignature(context, signature, timestamp, rawBody);
        } catch (error) {
            throw toRuntimeError("SLACK_VERIFY_REQUEST_SIGNATURE_FAILED", error);
        }
    }
}
