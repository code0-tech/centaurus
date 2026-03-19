# centaurus

The "central" place for all actions — a monorepo containing integrations provided by [code0](https://github.com/code0-tech) for the **Hercules** automation platform.

## Available Actions

| Action | Description |
|--------|-------------|
| [GLS](docs/Actions/GLS/overview.md) | GLS ShipIT integration for creating and managing shipments |

## ENV

All actions share the following base environment variables, which connect them to the Hercules/Aquila infrastructure:

| ENV Variable           | Description                                    | Default Value       |
|------------------------|------------------------------------------------|---------------------|
| `HERCULES_AUTH_TOKEN`  | Authentication token for connecting to Aquila. | `""` (empty string) |
| `HERCULES_AQUILA_URL`  | URL of the Aquila server to connect to.        | `"localhost:50051"` |
| `HERCULES_ACTION_ID`   | Identifier for the action being registered.    | `"<action-name>"`   |
| `HERCULES_SDK_VERSION` | Version of the Hercules SDK being used.        | `"0.0.0"`           |

## Quick Start

1. Clone the repository
2. Navigate to the action directory: `cd actions/<action-name>`
3. Copy the example env file: `cp .example.env .env`
4. Fill in your credentials and Hercules connection details in `.env`
5. Start the action: `docker compose up -d`

See the [Installation Guide](https://docs.code0.tech/hercules/Guides/installation.md) for detailed steps.

## Documentation

Full documentation is located at https://docs.code0.tech/hercules/ 