---
name: execute-scenario
description: Execute one or all BDD scenarios from a feature file, with optional Playwright recording.
---

# Execute BDD Scenario

Resolve a scenario selector (such as `ST-01` or `all`), the required `.feature` path, and optional `--record` mode from the user's request. Ask for any required value that is absent.

Load BOTH skills in this order:

1. `story-flow:execute-bdd-scenario` — plugin BDD framework
2. `execute-bdd-scenario` — project-level override or extension

Confirm both skills are loaded before continuing with execution.

Execute the resolved BDD scenario selection in the resolved feature file. Include `--record` only when requested.
