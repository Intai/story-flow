---
argument-hint: [@path/to/story.md]
description: Implememnt a story according to the requirements and tasks
---

Execute tasks according to $ARGUMENTS, running parallel tasks simultaneously using sub-agents. The story should have tasks grouped by dependencies using the format from analyze-task-dependencies skill. For every source file modified, update the corresponding test file. When a story references @agent-qa-tester for planning BDD scenarios, use the qa-tester subagent and instruct it to invoke the plan-bdd-scenarios skill via the Skill tool. Use context7.
