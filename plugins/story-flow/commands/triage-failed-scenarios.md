---
argument-hint: [npx playwright test arguments or where the failed scenarios are listed, e.g. --grep "DAS-01:|DAS-02:" or "failed scenarios in <issue URL>" (optional)]
description: Run the Playwright specs and triage each failing scenario — delete, update and re-record, or report as a defect
effort: medium
---

When the failed scenarios are listed in an issue, find the most recent earlier issue with the same title prefix that has a triage comment.
Apply the changes proposed in its later comments (e.g. a diff fixing a reported defect) that the checkout doesn't already have, and leave them uncommitted.

Execute the Playwright specs: `npx playwright test $ARGUMENTS`.
For each failed scenario, decide the cause against the current code and its story (the ticket ID in the feature file, or in its git log), fetched with the project's story tracker MCP tools when available:

- Behaviour removed: delete the scenario from both the feature file and the Playwright spec file.
- Behaviour changed intentionally: update the feature file steps, then re-record.
- Spec stale (locators, timing): re-record.
- App behaviour is wrong: do not change the scenario; report it as a defect. If it passes once a proposed change is applied, report the defect as fixed by that change, linking its comment.

Re-record with `/story-flow:execute-scenario <ID> @<feature file> --record`, at the failing project's form factor.
Confirm each re-recorded scenario passes on its failing project: `npx playwright test <spec file> --project=<project> --grep "<ID>:"`.
If it still fails, triage it again rather than re-recording a second time.
Then summarise each failure's cause, action and scenario author (`git blame` on its lines in the feature file), plus any flaky passes and the proposed changes applied.
