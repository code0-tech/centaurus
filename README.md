<br/>
<br/>
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/code0-tech/codezero/main/images/Codezero_Logo_White.svg">
  <img src="https://raw.githubusercontent.com/code0-tech/codezero/main/images/Codezero_Logo.svg" alt="CodeZero" width="200">
</picture>

### Every great idea starts at zero. <br/> Start with CodeZero.

**The open-source platform for building automations visually.<br/>Powered by AI, running wherever you want.**

[![Website](https://img.shields.io/badge/codezero.build-000000?logo=googlechrome&logoColor=white&style=for-the-badge)](https://codezero.build)
[![Docs](https://img.shields.io/badge/Docs-4B32C3?logo=readthedocs&logoColor=white&style=for-the-badge)](https://docs.codezero.build)
[![Discord](https://img.shields.io/discord/1173625923724124200?label=Discord&logo=discord&style=for-the-badge)](https://discord.com/invite/AyMB7DtA7P)
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?logo=youtube&logoColor=white&style=for-the-badge)](https://www.youtube.com/@CodeZeroBuild)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?logo=instagram&logoColor=white&style=for-the-badge)](https://www.instagram.com/codezero.tech/)

</div>

<br/>
<br/>

## What is Centaurus?

Centaurus is the central place for all actions built by [code0](https://github.com/code0-tech).

An action is a small service that adds new nodes and events to your flows. It connects to your runtime, registers everything it can do, and waits for your flows to call it. Every action in this repository lives in its own folder under [`actions/`](actions) and ships as its own container image.

## What is an action good for?

Actions bring the outside world into a flow. One action can talk to an API, send a message, read data, or react to something that happened elsewhere. You pick the actions you need, run them next to your runtime, and the nodes they provide show up on the canvas.

Because every action runs on its own, you only run what you actually use, and you can scale each one the way its workload demands.

## Getting started

All you need is [Docker](https://docs.docker.com/get-docker/). Every action ships as its own image, so you pull the one you need and run it next to your runtime.

```bash
docker run -d \
  -e HERCULES_AUTH_TOKEN=your-token \
  -e HERCULES_AQUILA_URL=your-runtime:50051 \
  ghcr.io/code0-tech/centaurus/<action-name>
```

You can also build an action straight from this repository.

```bash
git clone https://github.com/code0-tech/centaurus.git
cd centaurus/actions/<action-name>
docker build -t <action-name> .
```

Every action reads the same base settings for the connection to your runtime.

| Variable | Description | Default |
|---|---|---|
| `HERCULES_AUTH_TOKEN` | Token used to authenticate against the runtime. | `""` |
| `HERCULES_AQUILA_URL` | Address of the runtime the action connects to. | `"localhost:50051"` |
| `HERCULES_ACTION_ID` | Identifier the action registers itself under. | `"<action-name>"` |
| `HERCULES_SDK_VERSION` | Version of the SDK the action was built with. | `"0.0.0"` |

Anything beyond that belongs to the action itself and is documented in its own README.

## Documentation

Each action documents its nodes, its events, and its settings in its own folder. The full reference lives at [docs.codezero.build](https://docs.codezero.build).

## Development

The repository is a monorepo driven by npm scripts that run across every action.

```bash
npm run typecheck
npm run build
npm run test
```

Each action keeps its own dependencies, so you can work on one without touching the others.

## Community

CodeZero is open source and built in the open. Join us:

- [Discord](https://discord.com/invite/AyMB7DtA7P): ask questions, share flows, talk to the team
- [Docs](https://docs.codezero.build): guides and reference documentation
- [GitHub](https://github.com/code0-tech): all components, issues, and contributions
- [YouTube](https://www.youtube.com/@CodeZeroBuild): devlogs and product updates

Contributions are welcome, from new actions and nodes to docs and bug reports.

## License

Licensing varies per component. See the license file in each action folder for details.

---

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/code0-tech/codezero/main/images/CodeZero_Icon_White.svg">
  <img src="https://raw.githubusercontent.com/code0-tech/codezero/main/images/CodeZero_Icon.svg" alt="CodeZero icon" width="48">
</picture>

*Made with ❤️ by the CodeZero community*

</div>
