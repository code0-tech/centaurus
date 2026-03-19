---
title: Troubleshooting & Community Support
description: Frequently asked questions, troubleshooting tips, and community resources for the GLS Action.
---

# Troubleshooting & Community Support

---

## FAQ

### General

**Q: What is the GLS Action?**

A: The GLS Action is an integration for the Hercules automation platform that connects to the [GLS ShipIT API](https://api.gls-group.net). It lets you create and manage GLS shipments from within your flows without writing any API code.

---

**Q: What GLS services does this action support?**

A: The action supports all major GLS shipment types and services, including:
- Standard parcel delivery
- Shop delivery and shop returns
- Exchange shipments
- Delivery at work
- Deposit delivery
- Identity-verified delivery (Ident / IdentPIN)
- Flex delivery, signature, guaranteed 24h
- Tyre service, addressee-only delivery
- Saturday and next-working-day delivery (EXPRESS only)

See [Functions](../functions.md) for the complete list.

---

**Q: Do I need a paid GLS account?**

A: Yes. You need a GLS business account and API access. Register on the [GLS Developer Portal](https://dev-portal.gls-group.net) and create an application to obtain `client_id` and `client_secret`.

---

**Q: What is the `contact_id` and do I need it?**

A: The `contact_id` is a GLS-assigned identifier linked to your contract. It is required for some advanced operations (e.g. retrieving end-of-day reports with your account data). Contact GLS support to request it. It is **optional** for basic shipment creation.

---

**Q: Can I test the action without a real GLS account?**

A: GLS provides sandbox/test environments for some regions. Check the [GLS Developer Portal](https://dev-portal.gls-group.net) for sandbox API endpoint URLs and test credentials. Update `ship_it_api_url` and `auth_url` in your configuration to point to the sandbox endpoints.

---

### Installation & configuration

**Q: The action starts but immediately disconnects. What's wrong?**

A: Check the following:
1. `HERCULES_AUTH_TOKEN` — is it valid and not expired?
2. `HERCULES_AQUILA_URL` — is the Aquila server reachable from the Docker container?
3. Docker logs: `docker compose logs -f` — look for specific error messages

---

### Authentication & API errors

**Q: I get an `INVALID_PRODUCT` error when creating a Saturday delivery shipment.**

A: Saturday delivery (and next-working-day delivery) requires the shipment's `Product` to be set to `"EXPRESS"`. Change `Product: "PARCEL"` to `Product: "EXPRESS"` in your shipment data.

---

**Q: I get `ERROR_CREATING_GLS_SHIPMENT` — how do I find out what went wrong?**

A: Use `validateShipment` first to check your shipment data before creating it. The validation response includes specific `Issues` with `Rule` and `Location` fields pointing to the problematic field. See [Use Cases — Validate before creating](./use-cases#use-case-2-validate-before-creating).

---

**Q: Can I cancel a shipment after it has been picked up by GLS?**

A: No. Once GLS has scanned the parcel at a depot or delivery vehicle, cancellation is no longer possible. The `cancelShipment` function will return `result: "SCANNED"` in that case.

---


### Labels & printing

**Q: What label formats are supported?**

A: The action supports: `PDF`, `ZEBRA`, `INTERMEC`, `DATAMAX`, `TOSHIBA`, `PNG`. For reprint, additionally `PNG_200`.

Choose the format that matches your label printer.

---

**Q: The label data returned is base64-encoded. How do I print it?**

A: Decode `CreatedShipment.PrintData[0].Data` from base64, then:
- **PDF:** Save as a `.pdf` file and send to a PDF-capable printer
- **ZPL (ZEBRA):** Send the raw ZPL string directly to a Zebra label printer
- **PNG:** Save as a `.png` file and print as an image

---

**Q: Can I reprint a label after the parcel has been dispatched?**

A: Yes, use the `reprintParcel` function with the `TrackID` and the original `CreationDate`. Note that available template sets for reprinting are limited to `NONE`, `ZPL_200`, and `ZPL_300`.

---

## Common error codes

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `ERROR_CREATING_GLS_SHIPMENT` | API returned an error during shipment creation or management | Check `validateShipment` output for details |
| `INVALID_PRODUCT` | Used `"PARCEL"` product with a service that requires `"EXPRESS"` | Set `Product: "EXPRESS"` in the shipment |

---

## Still stuck?

If you cannot resolve your issue with the FAQ above:

1. **Check the action logs:** `docker compose logs -f` in the action directory
2. **Check the GLS API status:** Visit the [GLS Developer Portal](https://dev-portal.gls-group.net) for service announcements
3. **Open an issue** on GitHub (see below)

---

## GitHub

The source code for the GLS Action and all other Centaurus actions is available on GitHub:

🔗 **[https://github.com/code0-tech/centaurus](https://github.com/code0-tech/centaurus)**

Use the GitHub repository to:
- **Report bugs:** Open an [issue](https://github.com/code0-tech/centaurus/issues)
- **Request features:** Open a [discussion](https://github.com/code0-tech/centaurus/discussions) or issue with the `enhancement` label
- **Ask questions:** Use [GitHub Discussions](https://github.com/code0-tech/centaurus/discussions)

---

## Contributing

Contributions to Centaurus are welcome! Here is how to get started:

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/centaurus.git
cd centaurus
npm install
```

### 2. Create a new action (optional)

Use the scaffolding script to create a new action:

```bash
npm run create-action -- my-new-action
```

This creates a new directory at `actions/my-new-action/` with the standard structure.

### 3. Make your changes

- Follow the existing code style (TypeScript, Zod for validation, Hercules SDK patterns)
- Add tests for your changes in `src/index.test.ts`
- Run the test suite: `npm run test`
- Run the linter: `npm run lint`

### 4. Submit a pull request

Open a pull request against the `main` branch of [code0-tech/centaurus](https://github.com/code0-tech/centaurus). Include:
- A clear description of what you changed and why
- Test results showing your changes pass

### Development commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build all actions |
| `npm run test` | Run the test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run create-action -- <name>` | Scaffold a new action |

