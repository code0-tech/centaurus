import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("HubSpotFormSubmittedWebhook")
@DisplayIcon("simple:hubspot")
@Name({ code: "en-US", content: "HubSpot form submitted" })
@Description({ code: "en-US", content: "Triggered when a HubSpot form is submitted (lead capture). Delivered as a HubSpot webhook event." })
@DisplayMessage({ code: "en-US", content: "HubSpot form submitted on ${httpURL}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: HUBSPOT_WEBHOOK_EVENT): REST_ADAPTER_INPUT<HUBSPOT_WEBHOOK_EVENT>")
@EventSetting({
    identifier: "input_schema",
    hidden: true
})
@EventSetting({
    identifier: "httpMethod",
    hidden: true,
    defaultValue: "POST"
})
@EventSetting({
    identifier: "httpSchema",
    hidden: true,
    defaultValue: "application/json"
})
export class HubSpotFormSubmittedWebhook extends Rest {}
