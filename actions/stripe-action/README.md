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
