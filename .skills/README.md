# Skills

Step-by-step instructions for working on the actions in this repository, written
for coding agents and humans alike. Each skill lives in its own folder with a
`SKILL.md` (frontmatter `name` + `description`, then the instructions).

The reference implementation for every skill is
[`actions/discord-action`](../actions/discord-action). When a skill and that
action disagree, the action wins — fix the skill.

| Skill | Use it to |
|---|---|
| [`create-action`](create-action/SKILL.md) | Scaffold a new TypeScript action under `actions/` and wire it into CI. |
| [`add-function`](add-function/SKILL.md) | Add a runtime function (a node a flow calls). |
| [`add-data-type`](add-data-type/SKILL.md) | Add a data type, hand-written or generated from an OpenAPI spec. |
| [`add-event`](add-event/SKILL.md) | Add an event (a trigger that starts a flow) and fire it. |
| [`test-action`](test-action/SKILL.md) | Write and run the tests, typecheck, build and module export of an action. |
| [`review-action`](review-action/SKILL.md) | Check an action against the conventions before opening a PR. |

Typical order for a new integration: `create-action` → `add-data-type` →
`add-function` / `add-event` → `test-action` → `review-action`.

The skills cover TypeScript actions. The Rust actions (`cron-action`,
`rest-action`, `mcp-action`) use `hercules-sdk` and are not covered yet.
