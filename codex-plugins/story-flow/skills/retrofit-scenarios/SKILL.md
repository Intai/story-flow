---
name: retrofit-scenarios
description: Retrofit BDD scenarios from an existing implementation.
---

# Retrofit BDD Scenarios

Resolve a required `.feature` output path and either source paths or a feature description from the user's request. If the feature path is absent, ask for it.

Use the qa-tester subagent and instruct it to load skills in this order:

1. `story-flow:plan-bdd-scenarios` — plugin BDD planning protocol
2. `plan-bdd-scenarios` if it exists — project-level override or extension

Confirm which skills are loaded before continuing with BDD planning.

If source paths are present, plan BDD scenarios in the resolved feature file from the implementation in those paths. Otherwise, locate the implementation of the described feature in the codebase; if it cannot be found or does not settle the behaviour, observe the running app or any other source available. Then plan BDD scenarios in the resolved feature file from it.
