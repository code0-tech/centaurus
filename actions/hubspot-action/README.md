# HubSpot Action

HubSpot CRM integration for the **Hercules** automation platform. Lets flows
react to HubSpot webhook events and create, update, search, associate, and
annotate CRM records through the official
[`@hubspot/api-client`](https://www.npmjs.com/package/@hubspot/api-client) SDK
(HubSpot CRM v3 API).

## Configuration

The action has no global configuration and reads no environment variables
beyond the shared Hercules ones. Credentials are passed per node, only where
they are needed:

| Parameter | Used by | Description |
|-----------|---------|-------------|
| `AccessToken` | every CRM function (first parameter) | Private-app access token (Bearer) of the HubSpot account to use. |
| `ClientSecret` | `hubspotVerifyWebhookSignature` | Client secret of the HubSpot app that sends the webhooks. |

The triggers need no credentials. The utils (`hubspotCreate*` builders) don't
call HubSpot and take no token.

### Creating a private app

1. In HubSpot, go to **Settings → Integrations → Private Apps**.
2. Create a private app and grant the CRM scopes you need
   (`crm.objects.contacts.*`, `crm.objects.deals.*`, `crm.objects.companies.*`,
   `crm.schemas.*`, and note/engagement scopes for `hubspotAddNote`).
3. Pass the access token as `AccessToken` to the HubSpot nodes (ideally from a
   flow secret or variable rather than typed into every node).

### Webhooks (triggers)

The triggers use the shared `Rest` (webhook) event pattern. Point a HubSpot app
**webhook subscription** at the URL generated for the trigger. HubSpot batches
events, so the payload of every CRM trigger is a JSON **array** of change
events (up to 100 per request).

The watched property of `HubSpotContactPropertyChangedWebhook` is chosen on the
HubSpot subscription (`contact.propertyChange` + property name); webhook
triggers cannot carry extra settings. The changed property and its new value
are in each event's `propertyName` / `propertyValue`.

HubSpot has no app webhook subscription for form submissions. For
`HubSpotFormSubmittedWebhook`, create a HubSpot **workflow** with a
"Form submission" enrollment trigger and a **Send a webhook** action (POST,
JSON) that points at the trigger URL.

#### Verifying signatures

Call `hubspotVerifyWebhookSignature` at the start of the flow with the trigger
input and branch on the result. It supports v3 (`X-HubSpot-Signature-v3`,
rejected when older than 5 minutes) and v1/v2 (`X-HubSpot-Signature`), using the `ClientSecret` you pass in. v2 and
v3 sign the request URL too, so pass the exact public URL HubSpot called as
`RequestUrl`. The trigger only exposes the parsed body, so it is re-serialised
with `JSON.stringify`. This matches the compact JSON HubSpot sends.

## Triggers

| Identifier | Fires on | Payload |
|------------|----------|---------|
| `HubSpotContactCreatedWebhook` | `contact.creation` | `HubSpotContactCreatedWebhookPayload` |
| `HubSpotContactPropertyChangedWebhook` | `contact.propertyChange` | `HubSpotContactPropertyChangedWebhookPayload` |
| `HubSpotDealCreatedWebhook` | `deal.creation` | `HubSpotDealCreatedWebhookPayload` |
| `HubSpotDealStageChangedWebhook` | `deal.propertyChange` on `dealstage` | `HubSpotDealStageChangedWebhookPayload` |
| `HubSpotCompanyCreatedWebhook` | `company.creation` | `HubSpotCompanyCreatedWebhookPayload` |
| `HubSpotFormSubmittedWebhook` | form submission (via workflow webhook) | `HubSpotFormSubmittedWebhookPayload` |

## Functions

| Identifier | Signature | Description |
|------------|-----------|-------------|
| `hubspotCreateContact` | `(AccessToken, Email, Properties?): HUBSPOT_CONTACT` | Create a contact. |
| `hubspotUpdateContact` | `(AccessToken, ContactId, Properties): HUBSPOT_CONTACT` | Update a contact. |
| `hubspotGetContactByEmail` | `(AccessToken, Email): HUBSPOT_CONTACT` | Look up a contact by email. |
| `hubspotCreateDeal` | `(AccessToken, Name, Pipeline, Stage, Amount?, Properties?): HUBSPOT_DEAL` | Create a deal. |
| `hubspotUpdateDeal` | `(AccessToken, DealId, Properties): HUBSPOT_DEAL` | Update a deal. |
| `hubspotCreateCompany` | `(AccessToken, Name, Properties?): HUBSPOT_COMPANY` | Create a company. |
| `hubspotAssociate` | `(AccessToken, FromObjectType, FromId, ToObjectType, ToId, AssociationType?): BOOLEAN` | Associate two objects; default association unless a type is given. |
| `hubspotAddNote` | `(AccessToken, ObjectType, ObjectId, Body, Properties?): HUBSPOT_NOTE` | Create a note and attach it to a contact, deal, company, ... |
| `hubspotSearchObjects` | `(AccessToken, ObjectType, Filters, Query?, Properties?, Limit?): HUBSPOT_SEARCH_RESULT` | CRM search; all filters must match (AND). |
| `hubspotVerifyWebhookSignature` | `(ClientSecret, Input, RequestUrl?): BOOLEAN` | Validate the signature of an inbound HubSpot webhook. |

`Properties` is a `HUBSPOT_PROPERTY_MAP`. A JSON object string is accepted as
well, for backwards compatibility.

### Utils

Data-type builders, like the GLS `create*` utils:

| Identifier | Signature | Description |
|------------|-----------|-------------|
| `hubspotCreatePropertyMap` | `(Names: LIST<TEXT>, Values: LIST<TEXT>): HUBSPOT_PROPERTY_MAP` | Build a property map from parallel name/value lists. |
| `hubspotCreateSearchFilter` | `(PropertyName, Operator, Value?, Values?, HighValue?): HUBSPOT_SEARCH_FILTER` | Build a search filter (`EQ`, `GT`, `IN`, `BETWEEN`, `CONTAINS_TOKEN`, ...). |
| `hubspotCreateAssociationType` | `(AssociationTypeId, AssociationCategory?): HUBSPOT_ASSOCIATION` | Build an association type or label for `hubspotAssociate`. |

## Data types

- `HUBSPOT_CONTACT`, `HUBSPOT_DEAL`, `HUBSPOT_COMPANY`, `HUBSPOT_NOTE`: all
  share the SDK's `SimplePublicObject` envelope (`id`, `properties`,
  timestamps, `archived`).
- `HUBSPOT_SEARCH_RESULT`, `HUBSPOT_SEARCH_FILTER`, `HUBSPOT_ASSOCIATION`,
  `HUBSPOT_PROPERTY_MAP`.
- `HUBSPOT_WEBHOOK_EVENT` (a single change event) and one payload type per
  trigger (see [Triggers](#triggers)).

## Development

```bash
npm install
npm run typecheck
npm run build
npm run test
```
