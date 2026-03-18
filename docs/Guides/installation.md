---
title: Installation guide for actions
---

# Cloud edition

# Selfhosted

To install the Action on your self-hosted instance, follow these steps:

## Clone the repository:
```bash
git clone https://github.com/code0-tech/centaurus.git
```

#

## Navigate to the action directory:
```bash
cd centaurus/actions/<action-name>
```

#

## Create .env file and set the required environment variables:

Possible ENV variables:

| ENV Variable           | Description                                    | Default Value       |
|------------------------|------------------------------------------------|---------------------|
| `HERCULES_AUTH_TOKEN`  | Authentication token for connecting to Aquila. | `""` (empty string) |
| `HERCULES_AQUILA_URL`  | URL of the Aquila server to connect to.        | `"localhost:50051"` |
| `HERCULES_ACTION_ID`   | Identifier for the action being registered.    | `"<action-name>"`   |
| `HERCULES_SDK_VERSION` | Version of the Hercules SDK being used.        | `"0.0.0"`           |

Example (.env): 
```
HERCULES_AUTH_TOKEN=your_auth_token
...
```

#

## Install it via docker:
```bash
docker compose up -d
```

