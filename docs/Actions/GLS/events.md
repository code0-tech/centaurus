---
title: GLS Action Events
description: Events emitted by the GLS Action — what they are, how they trigger flows in Aquila, and what future events are planned.
---

# GLS Action Events

In the Hercules platform, **events** are notifications emitted **by an action** that trigger flows in Aquila. They are the opposite of functions: instead of a flow calling the action, the action pushes data to Aquila, which starts any flows that are listening for that event type.

---

## How events work

```
External world (e.g. GLS webhook / polling)
          │
          │ something happens (parcel delivered, shipment arrived, ...)
          ▼
    GLS Action
          │
          │  sdk.dispatchEvent(eventType, projectId, payload)
          ▼
       Aquila
          │
          │  routes event to all flows listening for eventType
          ▼
     Your Flow starts
          │
          │  event payload available as flow input
          ▼
     Flow nodes execute (functions, conditions, etc.)
```

An event carries a **payload** — the data associated with what happened (e.g. shipment details, tracking ID, status). Flows that subscribe to an event type receive this payload as their starting input.

---

## Current status

> **The GLS Action does not currently emit any events.**
>
> The GLS action presently only exposes **functions** (called by flows) and registers **data types** and **configuration**. Event support — where the action proactively notifies Aquila of changes — is **planned for a future release**.

---

## Planned events

The following events are candidates for future implementation. Once added, each will allow you to build flows that react automatically to GLS shipment lifecycle changes.

### `gls.shipment.arrived`

Emitted when a parcel arrives at a GLS depot or is scanned into the GLS network.

**Trigger mechanism:** The action would periodically poll the GLS tracking API (or receive a GLS webhook) and emit this event for each new scan.

**Payload type (planned):** `GLS_TRACKING_EVENT`

```
GLS Action (polling / webhook listener)
      │
      │  detects new scan for tracked parcel
      ▼
sdk.dispatchEvent("gls.shipment.arrived", projectId, {
  TrackID: "12345678",
  Status: "IN_TRANSIT",
  Location: "MUC-HUB",
  Timestamp: "2025-06-01T10:30:00Z"
})
      │
      ▼
Aquila → triggers all flows subscribed to "gls.shipment.arrived"
```

---

### `gls.shipment.delivered`

Emitted when a parcel is confirmed delivered to the recipient.

**Payload type (planned):** `GLS_TRACKING_EVENT`

```
sdk.dispatchEvent("gls.shipment.delivered", projectId, {
  TrackID: "12345678",
  Status: "DELIVERED",
  DeliveredAt: "2025-06-02T14:15:00Z",
  SignedBy: "J. Doe"
})
```

---

### `gls.shipment.failed`

Emitted when a delivery attempt fails (e.g. recipient not home, address problem).

**Payload type (planned):** `GLS_TRACKING_EVENT`

```
sdk.dispatchEvent("gls.shipment.failed", projectId, {
  TrackID: "12345678",
  Status: "DELIVERY_FAILED",
  Reason: "RECIPIENT_NOT_HOME",
  NextAttempt: "2025-06-03"
})
```

---

### `gls.shipment.returned`

Emitted when a parcel is returned to sender after failed delivery attempts.

---

## How events are implemented (SDK reference)

When events are added to the GLS Action, they will follow this pattern from the Hercules SDK:

### 1. Register the flow type (event definition)

```typescript
sdk.registerFlowTypes({
  identifier: "gls.shipment.arrived",
  editable: false,
  inputType: "GLS_TRACKING_EVENT",
  linkedDataTypes: ["GLS_TRACKING_EVENT"],
  name: [{ code: "en-US", content: "GLS Shipment Arrived" }],
  description: [{
    code: "en-US",
    content: "Triggered when a GLS parcel arrives at a depot or is scanned."
  }]
})
```

### 2. Dispatch the event when it occurs

```typescript
sdk.dispatchEvent(
  "gls.shipment.arrived",  // must match registered flow type identifier
  projectId,               // which project to notify
  payload                  // data payload (must match inputType)
)
```

### 3. User builds a flow triggered by the event

In the Hercules UI, users create a flow with **"GLS Shipment Arrived"** as the trigger. When the GLS action dispatches this event, Aquila starts the flow and provides the payload (e.g. `TrackID`, `Status`, `Location`) as the flow's input.

---

## Flow type settings

Flow types can expose **settings** that allow users to configure how an event filters or behaves. For example, a future `gls.shipment.arrived` event might let users specify:

| Setting | Type | Description |
|---------|------|-------------|
| `trackId` | string | Only trigger for a specific parcel |
| `statusFilter` | string[] | Only trigger for specific status codes |

Settings are defined in the `settings` array of `HerculesFlowType` and are configurable per-flow in the Hercules UI.

---

## Difference between events and functions

| | Events | Functions |
|-|--------|-----------|
| **Direction** | Action → Aquila | Flow → Action |
| **Who initiates** | The action (proactively) | The flow (on demand) |
| **Purpose** | React to something that happened externally | Perform an operation and return a result |
| **SDK method** | `registerFlowTypes` + `dispatchEvent` | `registerFunctionDefinitions` |
| **Example** | Parcel delivered → trigger notification flow | Create a shipment and return the label |
| **Current GLS status** | ❌ Not yet implemented | ✅ 26 functions available |
