import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { verifyWebhookSignature } from "../helpers.js";

interface RestAdapterInput {
    payload?: unknown;
    headers?: Record<string, unknown>;
}

@Identifier("hubspotVerifyWebhookSignature")
@DisplayIcon("simple:hubspot")
@Signature("<T>(ClientSecret: string, Input: REST_ADAPTER_INPUT<T>, RequestUrl?: string): BOOLEAN")
@Name({ code: "en-US", content: "Verify webhook signature" })
@DisplayMessage({ code: "en-US", content: "Verify HubSpot webhook signature" })
@Documentation({ code: "en-US", content: "Checks the X-HubSpot-Signature(-v3) header of an incoming HubSpot webhook against the client secret of the HubSpot app. Pass the trigger input unchanged. v3 and v2 signatures also cover the request URL, so RequestUrl must be the exact public URL HubSpot called. v3 requests older than 5 minutes are rejected. The body is re-serialised from the parsed payload, which matches the compact JSON HubSpot sends." })
@Description({ code: "en-US", content: "Returns true if a HubSpot webhook request carries a valid signature." })
@Parameter({ runtimeName: "ClientSecret", name: [{ code: "en-US", content: "Client secret" }], description: [{ code: "en-US", content: "The client secret of the HubSpot app that sends the webhooks." }] })
@Parameter({ runtimeName: "Input", name: [{ code: "en-US", content: "Webhook input" }], description: [{ code: "en-US", content: "The input of the HubSpot webhook trigger (payload and headers)." }] })
@Parameter({ runtimeName: "RequestUrl", name: [{ code: "en-US", content: "Request URL" }], description: [{ code: "en-US", content: "The full public URL HubSpot sent the webhook to. Required for v2/v3 signatures." }], optional: true })
export class HubSpotVerifyWebhookSignatureFunction {
    run(_context: FunctionContext, ClientSecret: string, Input: RestAdapterInput, RequestUrl?: string): boolean {
        const clientSecret = ClientSecret?.trim();
        if (!clientSecret) {
            throw new RuntimeError("MISSING_HUBSPOT_CLIENT_SECRET", "No HubSpot client secret was given.");
        }
        // HubSpot always delivers webhooks with POST.
        return verifyWebhookSignature(clientSecret, Input?.headers, Input?.payload, "POST", RequestUrl);
    }
}
