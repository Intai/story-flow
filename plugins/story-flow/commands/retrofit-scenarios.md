---
argument-hint: [@path/to/file.feature, @path/to/source (use * for wildcard) or "feature description"]
description: Retrofit BDD scenarios from an existing implementation
---

Use the qa-tester subagent and instruct it to load skills in this order using the Skill tool:
1. First: `story-flow:plan-bdd-scenarios` (plugin - general BDD planning protocol)
2. Then: `plan-bdd-scenarios` if it exists (project-level - overrides/extends the plugin)
3. Confirm which skills are loaded before continuing with BDD planning.

If source paths are provided ($2 onwards):
  Plan BDD scenarios in $1 from the implementation in $2 $3 $4 $5 $6.
If a feature description is provided instead:
  Locate the implementation of $2 in the codebase; if it cannot be found or does not settle the behaviour, observe the running app or any other source available. Then plan BDD scenarios in $1 from it.
