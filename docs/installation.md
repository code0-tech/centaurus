---
title: Installation guide for actions
---

# Cloud edition

The cloud edition is managed by code0 and requires no installation. Contact the code0 team for access.

---

# Self-hosted

To install an action on your self-hosted instance, follow these steps:

## Prerequisites

Before you begin, make sure you have the following:

- **Git** installed on your machine
- **Docker** and **Docker Compose** installed
- A running **Aquila** server (part of the Hercules platform)
- Your `HERCULES_AUTH_TOKEN` from the Aquila admin panel
- Service-specific credentials (e.g. GLS API keys — see [GLS Configuration](Actions/GLS/configs.md))

---

## 1. Clone the repository

```bash
git clone https://github.com/code0-tech/centaurus.git
cd centaurus
```

---

## 2. Navigate to the action directory

Replace `<action-name>` with the name of the action you want to deploy (e.g. `gls-action`):

```bash
cd actions/<action-name>
```

---

## 3. Create the `.env` file

Copy the example environment file and fill in your values:

```bash
cp .example.env .env
```

Then open `.env` in your editor and set the required variables:

### Common ENV variables (all actions)

| ENV Variable           | Description                                         | Default Value       | Required |
|------------------------|-----------------------------------------------------|---------------------|----------|
| `HERCULES_AUTH_TOKEN`  | Authentication token for connecting to Aquila.      | `""` (empty string) | Yes      |
| `HERCULES_AQUILA_URL`  | URL of the Aquila server to connect to.             | `"localhost:50051"` | Yes      |
| `HERCULES_ACTION_ID`   | Unique identifier for this action in Hercules.      | `"<action-name>"`   | Yes      |
| `HERCULES_SDK_VERSION` | Version of the Hercules SDK being used.             | `"0.0.0"`           | No       |

Example `.env` for the GLS action:

```
HERCULES_AUTH_TOKEN=your_hercules_auth_token
HERCULES_AQUILA_URL=your-aquila-host:50051
HERCULES_ACTION_ID=gls-action
HERCULES_SDK_VERSION=1.0.0
```

For action-specific variables (e.g. GLS API credentials), see the [GLS Configuration](Actions/GLS/configs.md) page.

---

## 4. Start with Docker Compose

```bash
docker compose up -d
```

The action will start, connect to your Aquila server, and register its functions and types. You can check the logs with:

```bash
docker compose logs -f
```

A successful startup will show:

```
SDK connected successfully
```

---

## 5. Verify the action is registered

Open your Hercules/Aquila admin panel and navigate to the **Actions** section. The action should appear in the list with its registered functions and types.

---

## Updating the action

To update to a newer version:

```bash
git pull
docker compose up -d --build
```

---

## Troubleshooting

If the action fails to start or connect, check:

- That `HERCULES_AUTH_TOKEN` is valid and not expired
- That `HERCULES_AQUILA_URL` points to the correct host and port
- That Docker has access to the internet (for pulling the base image)
- The service-specific credentials are correct (see [Troubleshooting](Actions/GLS/troubleshooting.md))

