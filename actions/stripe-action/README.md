# Stripe Action

Stripe payments integration for the **Hercules** automation platform.

Version 1 provides the core payment primitives as runtime functions plus two
incoming webhook events.

## Functions

| Function | Description |
|----------|-------------|
| `createCustomer` | Create a Stripe customer. |
| `createPaymentIntent` | Create a PaymentIntent to collect a payment. |
| `retrievePaymentIntent` | Retrieve a PaymentIntent by its id. |
| `createRefund` | Refund a PaymentIntent (fully or partially). |

## Events

| Event | Stripe webhook |
|-------|----------------|
| `StripePaymentIntentSucceededWebhook` | `payment_intent.succeeded` |
| `StripeChargeRefundedWebhook` | `charge.refunded` |

## Configuration

| Config | Required | Description |
|--------|----------|-------------|
| `secret_key` | yes | Stripe secret API key (`sk_...`). Use a test key for testing. |
| `api_version` | no | Stripe API version to pin (e.g. `2024-06-20`). Empty uses the account default. |
| `webhook_secret` | no | Stripe webhook signing secret (`whsec_...`) for verifying incoming events. |

All API calls use the official [`stripe`](https://www.npmjs.com/package/stripe)
Node.js SDK.

## Data type schemas

The `@Schema` data types use `zod` schemas generated from Stripe's official
OpenAPI spec — the same approach used by `twilio-action`, `woocommerce-action`
and `shopware-action`. The generated schemas live in
`src/generated/stripe-schemas.ts` and each data type re-exposes one, e.g.:

```ts
import {schemas} from "../generated/stripe-schemas.ts";
export const StripeCustomerSchema = schemas.customer;
```

Webhook payloads wrap a resource schema in the Stripe event envelope
(`{ id, object: "event", type, data: { object: <resource> }, … }`), with
`data.object` set to `schemas.payment_intent` / `schemas.charge`.

To regenerate after a Stripe API update:

```bash
npm run generate:stripe-schemas
```

This downloads Stripe's `spec3.sdk.json`, filters it down to the resource
schemas the action exposes (`scripts/filterStripeSpec.mjs` keeps `customer`,
`payment_intent`, `refund`, `charge`), runs
[`openapi-zod-client`](https://www.npmjs.com/package/openapi-zod-client) to
emit `src/generated/stripe-schemas.ts`, then applies the zod v4 fix-ups in
`scripts/patchGeneratedSchemas.mjs`.

> Regeneration requires network access to `registry.npmjs.org` (for
> `openapi-zod-client`) and `raw.githubusercontent.com` (for the spec).
