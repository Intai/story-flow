---
argument-hint: [npx playwright test arguments, e.g. path/to/file.spec.js --grep "DAS-01:|DAS-02:" (optional)]
description: Run the Playwright specs and triage each failing scenario — delete, update and re-record, or report as a defect
effort: medium
---

Execute the Playwright specs: `npx playwright test $ARGUMENTS`.
For each failed scenario, decide the cause against the current code and its story (the ticket ID in the feature file, or in its git log), fetched with the project's story tracker MCP tools when available:

- Behaviour removed: delete the scenario from both the feature file and the Playwright spec file.
- Behaviour changed intentionally: update the feature file steps, then re-record.
- Spec stale (locators, timing): re-record.
- App behaviour is wrong: do not change the scenario; report it as a defect.

Re-record with `/story-flow:execute-scenario <ID> @<feature file> --record`, at the failing project's form factor.
Confirm each re-recorded scenario passes on its failing project: `npx playwright test <spec file> --project=<project> --grep "<ID>:"`.
If it still fails, triage it again rather than re-recording a second time.
Then summarise each failure's cause and action, plus any flaky passes.
