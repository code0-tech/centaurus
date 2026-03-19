---
title: GLS Action Events
description: Events emitted by the GLS Action — what they are, how they trigger flows in Aquila, and what future events are planned.
---

# GLS Action Events

In the Hercules platform, **events** are notifications emitted **by an action** that trigger flows in Aquila. They are the opposite of functions: instead of a flow calling the action, the action pushes data to Aquila, which starts any flows that are listening for that event type.

---

## Current status

> **The GLS Action does not currently emit any events.**
>
> The GLS action presently only exposes **functions** (called by flows) and registers **data types** and **configuration**. Event support — where the action proactively notifies Aquila of changes — is **planned for a future release**.

---