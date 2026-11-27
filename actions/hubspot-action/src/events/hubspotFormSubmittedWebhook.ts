import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("HubSpotFormSubmittedWebhook")
@DisplayIcon("simple:hubspot")
@Name({ code: "en-US", content: "HubSpot form submitted" })
@Description({ code: "en-US", content: "Triggered when a HubSpot form is submitted (lead capture). Sent by a HubSpot workflow with a form-submission trigger and a 'Send a webhook' action." })
@DisplayMessage({ code: "en-US", content: "HubSpot form submitted on ${http_url}" })
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: HubSpotFormSubmittedWebhookPayload): REST_ADAPTER_INPUT<HubSpotFormSubmittedWebhookPayload>")
@EventSetting({
    identifier: "input_schema",
    hidden: true
})
@EventSetting({
    identifier: "http_method",
    hidden: true,
    defaultValue: "POST"
})
@EventSetting({
    identifier: "http_schema",
    hidden: true,
    defaultValue: "application/json"
})
export class HubSpotFormSubmittedWebhook extends Rest {}
