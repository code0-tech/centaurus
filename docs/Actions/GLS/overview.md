---
title: GLS Action Overview
description: Overview of the GLS ShipIT action — what it does, what you need to get started, and how it fits into your flows.
---

# GLS Action

The **GLS Action** integrates the [GLS ShipIT API](https://api.gls-group.net) into the Hercules automation platform. It lets you create, validate, cancel, and manage GLS parcel shipments directly from your flows — no manual API calls required.

---

## What can the GLS Action do?

- **Create shipments** of various types: standard delivery, shop delivery, returns, exchanges, Saturday delivery, and more
- **Validate shipments** before committing them to the API
- **Cancel shipments** that haven't been picked up yet
- **Retrieve allowed services** for a given origin/destination combination
- **Get end-of-day reports** summarizing all shipments dispatched on a given date
- **Update parcel weight** after a shipment has been created
- **Reprint parcel labels** in PDF, PNG, or ZPL format

---

## Prerequisites

Before using the GLS Action you will need:

### Hercules / Aquila

| Requirement | Description |
|-------------|-------------|
| Running Aquila server | The action connects to Aquila on startup to register its functions |
| `HERCULES_AUTH_TOKEN` | Auth token issued by your Aquila instance |
| `HERCULES_AQUILA_URL` | Host and port of your Aquila server (e.g. `aquila.example.com:50051`) |
| Docker + Docker Compose | Used to run the action as a container |

### GLS Developer Portal

| Requirement | How to obtain |
|-------------|---------------|
| `client_id` | Create an application at [https://dev-portal.gls-group.net](https://dev-portal.gls-group.net) and find it under **My Apps** |
| `client_secret` | Found alongside the `client_id` in **My Apps** on the GLS developer portal |
| `contact_id` *(optional)* | Issued by GLS support — contact them directly to request it |

> **Note:** The `contact_id` is required for some shipment operations. If you are unsure whether you need it, contact GLS support.

---

## Architecture overview

```
Your Flow (Hercules)
       │
       ▼
 GLS Action (this action)
       │
       ├── Authenticates with GLS via OAuth2
       │         └── GLS Auth API (/oauth2/v2/token)
       │
       └── Calls GLS ShipIT API
                 └── GLS ShipIT API (/shipit-farm/v1/backend/rs/...)
```

The action handles OAuth2 token management automatically, including caching and refresh before expiry. You only need to provide the `client_id` and `client_secret` in the action configuration.

---

## Data flow

```
Flow Input
    │
    ▼
Builder Functions          ← createAddress, createConsignee, createShipmentUnit, ...
    │
    ▼
Shipment Functions         ← createShopDeliveryShipment, createExchangeShipment, ...
    │
    ▼
GLS ShipIT API
    │
    ▼
GLS_CREATE_PARCELS_RESPONSE  ← tracking IDs, barcode data, print data, routing info
```

---

## Next steps

- [Quick Start](./quick-start) — Create your first shipment in a few steps
- [Configuration](./configs) — Full list of configuration options and how to get credentials
- [Functions](./functions) — All available functions with parameter details
- [Types](./types) — All data types used in the GLS Action
- [Events](./events) — Events emitted by the GLS Action
- [Common Use Cases](./use-cases) — Example flows for real-world scenarios
- [Troubleshooting](./troubleshooting) — FAQ and community support
