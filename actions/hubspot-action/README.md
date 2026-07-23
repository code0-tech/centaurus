# HubSpot Action

HubSpot CRM integration for the **Hercules** automation platform. Lets flows
react to HubSpot webhook events and create, update, search, associate, and
annotate CRM records through the official
[`@hubspot/api-client`](https://www.npmjs.com/package/@hubspot/api-client) SDK
(HubSpot CRM v3 API).

## Configuration

Configured via the action's `ConfigurationDefinition`s:

| Identifier | Type | Required | Description |
|------------|------|----------|-------------|
| `access_token` | TEXT | yes | Private-app access token (Bearer) for the HubSpot CRM API. |
| `app_id` | TEXT | no | HubSpot app id, used when managing webhook subscriptions. |
| `client_secret` | TEXT | no | HubSpot app client secret, used to validate the `X-HubSpot-Signature` on inbound webhooks. |

Beyond the shared Hercules variables (`HERCULES_AUTH_TOKEN`,
`HERCULES_AQUILA_URL`, `HERCULES_ACTION_ID`, `HERCULES_SDK_VERSION`), the only
provider-specific credential required is the HubSpot private-app access token.

### Creating a private app

1. In HubSpot, go to **Settings → Integrations → Private Apps**.
2. Create a private app and grant the CRM scopes you need
   (`crm.objects.contacts.*`, `crm.objects.deals.*`, `crm.objects.companies.*`,
   `crm.schemas.*`, and note/engagement scopes for `hubspotAddNote`).
3. Copy the access token into the action's `access_token` config.

### Webhooks (triggers)

The triggers use the shared `Rest` (webhook) event pattern. Point a HubSpot app
**webhook subscription** at the URL generated for the trigger. HubSpot delivers
a JSON array of change events; each event is exposed to the flow as a
`HUBSPOT_WEBHOOK_EVENT`. To verify signatures, configure `client_secret`.

## Triggers

| Identifier | Fires on |
|------------|----------|
| `HubSpotContactCreatedWebhook` | `contact.creation` |
| `HubSpotDealCreatedWebhook` | `deal.creation` |
| `HubSpotDealStageChangedWebhook` | `deal.propertyChange` on `dealstage` |
| `HubSpotFormSubmittedWebhook` | form submission (lead capture) |

## Functions

| Identifier | Signature | Description |
|------------|-----------|-------------|
| `hubspotCreateContact` | `(Email, PropertiesJson?): HUBSPOT_CONTACT` | Create a contact. |
| `hubspotUpdateContact` | `(ContactId, PropertiesJson): HUBSPOT_CONTACT` | Update a contact. |
| `hubspotGetContactByEmail` | `(Email): HUBSPOT_CONTACT` | Look up a contact by email. |
| `hubspotCreateDeal` | `(Name, Pipeline, Stage, Amount?, PropertiesJson?): HUBSPOT_DEAL` | Create a deal. |
| `hubspotUpdateDeal` | `(DealId, PropertiesJson): HUBSPOT_DEAL` | Update a deal. |
| `hubspotCreateCompany` | `(Name, PropertiesJson?): HUBSPOT_COMPANY` | Create a company. |
| `hubspotAddNote` | `(Body, PropertiesJson?): HUBSPOT_NOTE` | Create a note engagement. |
| `hubspotAssociate` | `(FromObjectType, FromId, ToObjectType, ToId): BOOLEAN` | Create the default association between two objects. |
| `hubspotSearchObjects` | `(ObjectType, Query): HUBSPOT_SEARCH_RESULT` | Full-text search a CRM object type. |

### Property maps

HubSpot CRM properties are a dynamic key/value bag, so functions accept extra
properties as a **JSON object string** (e.g.
`{"firstname":"Ada","lifecyclestage":"lead"}`) rather than a fixed set of typed
parameters. Values are coerced to strings, matching the HubSpot API.

## Data types

`HUBSPOT_CONTACT`, `HUBSPOT_DEAL`, `HUBSPOT_COMPANY`, `HUBSPOT_NOTE` (all share
the SDK's `SimplePublicObject` envelope: `id`, `properties`, timestamps,
`archived`), plus `HUBSPOT_SEARCH_RESULT` and `HUBSPOT_WEBHOOK_EVENT`.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run test
```
