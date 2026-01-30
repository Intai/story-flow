---
argument-hint: [@path/to/story.md]
description: Implememnt a story according to the requirements and tasks
---

Execute tasks according to $ARGUMENTS using sub-agents. Use context7.

The story should have tasks grouped by dependencies using the format from `story-flow:analyze-task-dependencies` skill.

## Orchestrator Rules

You are an **orchestrator**, not an implementer.

**REQUIRED:** Immediately delegate ALL tasks to sub-agents using the **Task tool**.

**FORBIDDEN tools for orchestrator (NEVER use directly):**
- Write, Edit, MultiEdit, NotebookEdit
- TaskCreate, TaskUpdate, TaskGet, TaskList

## Testing Requirement

Instruct each sub-agent: For every source file created or modified, update the corresponding test file to achieve 100% coverage.

## QA Agent Special Instructions

When a story references @agent-qa-tester for planning BDD scenarios, use the qa-tester subagent and instruct it to load BOTH skills in this order using the Skill tool:
1. First: `story-flow:plan-bdd-scenarios` (plugin - general BDD planning protocol)
2. Then: `plan-bdd-scenarios` (project-level - overrides/extends the plugin)
3. Confirm both skills are loaded before continuing with BDD planning.
