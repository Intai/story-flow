---
argument-hint: [ST-01 or all, @path/to/file.feature (use * for wildcard), ..., --record (optional)]
description: Execute BDD test scenarios in a .feature file using browser automation. Use --record to generate a Playwright .spec.js file.
effort: medium
---

Load BOTH skills in this order using the Skill tool:
1. First: `story-flow:execute-bdd-scenario` (plugin - general BDD framework)
2. Then: `execute-bdd-scenario` (project-level - overrides/extends the plugin)
3. Confirm both skills are loaded before continuing with the execution.

Execute BDD scenario $1 in $2 $3 $4 $5 $6.
