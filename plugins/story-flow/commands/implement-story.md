---
argument-hint: [@path/to/story.md]
description: Implememnt a story according to the requirements and tasks
---

Execute tasks according to $ARGUMENTS, running parallel tasks simultaneously using sub-agents. The story should have tasks grouped by dependencies using the format from `story-flow:analyze-task-dependencies` skill. For every source file modified, update the corresponding test file to achieve 100% coverage. Use context7.

When a story references @agent-qa-tester for planning BDD scenarios, use the qa-tester subagent and instruct it to load BOTH skills in this order using the Skill tool:
1. First: `story-flow:plan-bdd-scenarios` (plugin - general BDD planning protocol)
2. Then: `plan-bdd-scenarios` (project-level - overrides/extends the plugin)
3. Confirm both skills are loaded before continuing with BDD planning.
