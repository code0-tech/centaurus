---
title: Configuration
description: All configuration options for the GLS Action, including how to obtain credentials from the GLS Developer Portal.
---

# GLS Action Configuration

The GLS action requires a few credentials to authenticate with the GLS ShipIT API. These are set as **configuration values** in the Hercules admin panel (not as environment variables).

---

## Configuration reference

| Config Name       | Type        | Required | Default                                               | Description                                                                   |
|-------------------|-------------|----------|-------------------------------------------------------|-------------------------------------------------------------------------------|
| `client_id`       | string      | **Yes**  | —                                                     | OAuth2 client ID for authenticating with the GLS API                          |
| `client_secret`   | string      | **Yes**  | —                                                     | OAuth2 client secret for authenticating with the GLS API                      |
| `contact_id`      | string      | No       | `""`                                                  | GLS contact ID used in some API requests (see note below)                     |
| `ship_it_api_url` | string      | No       | `https://api.gls-group.net/shipit-farm/v1/backend/rs` | GLS ShipIT API base URL                                                       |
| `auth_url`        | string      | No       | `https://api.gls-group.net/oauth2/v2/token`           | GLS OAuth2 token endpoint — must end in `/token`                              |
| `shipper`         | GLS_SHIPPER | No       | —                                                     | Default shipper address used when no shipper is provided in the shipment data |

> **`contact_id`:** This identifier is required for certain shipment operations (e.g. end-of-day reports and some services). It is issued by GLS support — contact them directly to request it.

---

## How to obtain your credentials

### Step 1 — Create a GLS Developer account

1. Go to [https://dev-portal.gls-group.net/get-started](https://dev-portal.gls-group.net/get-started)
2. Click **Sign In** and register a new account, or log in with an existing GLS account
3. Complete the registration and verify your email address

### Step 2 — Create an application

1. After logging in, navigate to **My Apps** in the top navigation
2. Click **Create App** (or **New Application**)
3. Fill in the application name and description
4. Select the required API scopes (typically **ShipIT**)
5. Submit the form

### Step 3 — Retrieve your credentials

1. Open the application you just created in **My Apps**
2. Copy the **Client ID** — this is your `client_id`
3. Copy the **Client Secret** — this is your `client_secret`

> Keep the `client_secret` confidential. Do not commit it to source control.

### Step 4 — Get your Contact ID (optional)

The `contact_id` is not available in the developer portal. You must contact **GLS support** directly and ask them to provide you with a Contact ID linked to your GLS contract.

---

## API endpoints

GLS provides different API endpoints depending on your region and environment. The defaults point to the global production API:

| Setting | Default URL |
|---------|-------------|
| `ship_it_api_url` | `https://api.gls-group.net/shipit-farm/v1/backend/rs` |
| `auth_url` | `https://api.gls-group.net/oauth2/v2/token` |

If you are using a regional or sandbox endpoint, update these values accordingly. Always ensure `auth_url` ends with `/token`.

---

## Authentication flow

The GLS Action authenticates using **OAuth2 client credentials**:

```
GLS Action
    │
    ├── POST {auth_url}
    │     body: grant_type=client_credentials
    │           client_id=<your-client-id>
    │           client_secret=<your-client-secret>
    │
    │◄── { access_token, expires_in }
    │
    └── All subsequent API calls include:
          Authorization: Bearer <access_token>
```

Tokens are **cached** and automatically refreshed 60 seconds before they expire. You do not need to manage token lifecycle manually.

---

## Default shipper

The optional `shipper` config allows you to set a **default sender address** that is applied to all shipments when no shipper is explicitly provided in the shipment data. This is useful when all your shipments originate from the same address.

The value must be a valid `GLS_SHIPPER` object:

```json
{
  "Address": {
    "Name1": "My Company GmbH",
    "CountryCode": "DE",
    "City": "Berlin",
    "Street": "Hauptstrasse",
    "ZIPCode": "10115"
  }
}
```

See [Types — GLS_SHIPPER](types.md#GLS_SHIPPER) for the full field reference.
