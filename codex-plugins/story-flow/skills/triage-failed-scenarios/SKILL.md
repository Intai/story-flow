---
name: triage-failed-scenarios
description: Run the Playwright specs and triage each failing scenario — delete, update and re-record, or report as a defect.
---

# Triage Failed Scenarios

Resolve optional `npx playwright test` arguments (such as a spec path or `--grep "DAS-01:|DAS-02:"`) from the user's request.

Execute the Playwright specs: `npx playwright test` with the resolved arguments.
For each failed scenario, decide the cause against the current code and its story (the ticket ID in the feature file, or in its git log), fetched with the project's story tracker MCP tools when available:

- Behaviour removed: delete the scenario from both the feature file and the Playwright spec file.
- Behaviour changed intentionally: update the feature file steps, then re-record.
- Spec stale (locators, timing): re-record.
- App behaviour is wrong: do not change the scenario; report it as a defect.

Re-record with the `story-flow:execute-scenario` skill for the scenario ID and its feature file in `--record` mode, at the failing project's form factor.
Confirm each re-recorded scenario passes on its failing project: `npx playwright test <spec file> --project=<project> --grep "<ID>:"`.
If it still fails, triage it again rather than re-recording a second time.
Then summarise each failure's cause and action, plus any flaky passes.
