---
title: Quick Start — GLS Action
description: Create your first GLS shipment in a few steps.
---

# Quick Start

This guide walks you through creating your first GLS shipment using the GLS Action. By the end, you will have a working flow that creates a parcel and retrieves a shipping label.

---

## Step 1: Install and configure the action

Follow the [Installation Guide](../../Guides/installation.md) to deploy the GLS Action, then set the following configuration values in your Hercules admin panel (or `.env` file):

| Config | Value |
|--------|-------|
| `client_id` | Your GLS OAuth2 client ID |
| `client_secret` | Your GLS OAuth2 client secret |
| `ship_it_api_url` | GLS ShipIT endpoint (default: `https://api.gls-group.net/shipit-farm/v1/backend/rs`) |
| `auth_url` | GLS auth endpoint (default: `https://api.gls-group.net/oauth2/v2/token`) |

See [Configuration](./configs.md) for the full list of options and how to obtain credentials.

---

## Step 2: Build your flow

A basic "create a GLS parcel" flow looks like this:

```
[createAddress]          → GLS_ADDRESS (recipient)
[createAddress]          → GLS_ADDRESS (shipper)
[createShipmentUnit]     → GLS_SHIPMENT_UNIT
[createPrintingOptions]  → GLS_PRINTING_OPTIONS
[createShopDeliveryShipment] → GLS_CREATE_PARCELS_RESPONSE
```

### Flow diagram

```
START
  │
  ├─ createAddress (recipient)
  │     Name1: "John Doe"
  │     CountryCode: "DE"
  │     City: "Munich"
  │     Street: "Musterstrasse"
  │     ZIPCode: "80331"
  │         │
  │         ▼ GLS_ADDRESS (recipient)
  │
  ├─ createAddress (shipper)
  │     Name1: "My Company GmbH"
  │     CountryCode: "DE"
  │     City: "Berlin"
  │     Street: "Hauptstrasse"
  │     ZIPCode: "10115"
  │         │
  │         ▼ GLS_ADDRESS (shipper)
  │
  ├─ createShipmentUnit
  │     weight: 2.5
  │         │
  │         ▼ GLS_SHIPMENT_UNIT
  │
  ├─ createPrintingOptions
  │     returnLabels:
  │       TemplateSet: "NONE"
  │       LabelFormat: "PDF"
  │         │
  │         ▼ GLS_PRINTING_OPTIONS
  │
  └─ createShopDeliveryShipment
        parcelShopId: "12345"
        shipment:
          Product: "PARCEL"
          Consignee: { Address: <recipient address> }
          Shipper: { Address: <shipper address> }
          ShipmentUnit: [<shipment unit>]
        printingOptions: <printing options>
            │
            ▼ GLS_CREATE_PARCELS_RESPONSE
              { CreatedShipment: { TrackID, PrintData, ... } }
```

---

## Step 3: Use the response

The `GLS_CREATE_PARCELS_RESPONSE` contains everything you need:

```json
{
  "CreatedShipment": {
    "ShipmentReference": ["REF-001"],
    "ParcelData": [
      {
        "TrackID": "12345678",
        "ParcelNumber": "00123456789",
        "Barcodes": {
          "Primary2D": "...",
          "Secondary2D": "...",
          "Primary1D": "..."
        },
        "RoutingInfo": {
          "Tour": "MUC-01",
          "FinalLocationCode": "MUC",
          "HubLocation": "MUC-HUB"
        }
      }
    ],
    "PrintData": [
      {
        "Data": "<base64-encoded-pdf>",
        "LabelFormat": "PDF"
      }
    ]
  }
}
```

- **`TrackID`** — Use this to track the parcel or cancel the shipment later
- **`PrintData[].Data`** — Base64-encoded shipping label, decode and print it
- **`RoutingInfo`** — Routing information assigned by GLS

---

## Common next steps

- [Validate before creating](./functions.md#validateShipment) — Call `validateShipment` first to catch errors before committing
- [Cancel a shipment](./functions.md#cancelShipment) — Use `cancelShipment` with the `TrackID` if something changes
- [Reprint a label](./functions.md#reprintParcel) — Use `reprintParcel` if a label is lost or damaged
- [Common Use Cases](./use-cases.md) — End-to-end examples for real-world scenarios
