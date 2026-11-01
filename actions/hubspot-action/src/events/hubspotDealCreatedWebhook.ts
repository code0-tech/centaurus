import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("HubSpotDealCreatedWebhook")
@DisplayIcon("simple:hubspot")
@Name({ code: "en-US", content: "HubSpot deal created" })
@Description({ code: "en-US", content: "Triggered when a new deal is created in HubSpot (subscription type deal.creation)." })
@DisplayMessage({ code: "en-US", content: "HubSpot deal created on ${httpURL}" })
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
export class HubSpotDealCreatedWebhook extends Rest {}
