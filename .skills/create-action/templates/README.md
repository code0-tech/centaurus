# __Vendor__ Action

__DESCRIPTION__

The action holds no credentials of its own: **every runtime function and every
event takes the `<credential>` it works with as its first parameter**, so one
running action serves as many __Vendor__ accounts as its flows use. There is
nothing to configure on the module.

## Functions

| Function | Description |
|----------|-------------|
| `__vendor__SendMessage` | Send a message to a channel. |

Each one starts with the `<credential>` parameter, followed by the ids it needs
(e.g. `__vendor__SendMessage(<credential>, channelId, content)`).

## Events

| Event | Fires when | Settings |
|-------|------------|----------|
| `__Vendor__MessageCreated` | A message is posted. | `<credential>`, `channelId?` |

An optional setting that is left empty is a wildcard.

## Payloads always carry every field

Everything a function returns and every event payload contains **all** fields of
its data type: what __Vendor__ did not send is `null`, never missing, so a flow
reading it resolves the reference instead of failing with
`ReferenceValueNotFound`.

## Setup

<What has to be done on the vendor side: create an app/bot/API key, required
scopes or permissions, where to find the credential.>

## ENV

| Variable | Description | Default |
|----------|-------------|---------|
| `ACTION_ID` | Identifier the action registers with. | `__vendor__-action` |
| `VERSION` | Version reported to Aquila. | `1.0.0` |
| `AQUILA_URL` | Aquila address. | `127.0.0.1:8081` |
| `AUTH_TOKEN` | Token used to connect to Aquila. | — |

No __Vendor__ credentials are read from the environment.
