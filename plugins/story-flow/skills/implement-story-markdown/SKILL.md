---
name: Implememnt a story according to the requirements and tasks
description: Implememnt story.md requirements and tasks.
---

# Implememnt a story according to the requirements and tasks

## Instructions

- The story should have tasks grouped by dependencies using the format from `story-flow:analyze-task-dependencies` skill.
- You are an **orchestrator**, not an implementer.
  - **REQUIRED:** Immediately delegate ALL tasks to subagents using the **Task tool**.
  - **FORBIDDEN tools for orchestrator (NEVER use directly):**
    - Write, Edit, MultiEdit
    - TaskCreate, TaskUpdate, TaskGet, TaskList
- Instruct each subagent: For every source file created or modified, update the corresponding test file to achieve 100% coverage and ensure all linting warnings and errors are resolved.
  - One test case per scenario/behavior, not one test per assertion.
  - Combine test assertions for basic rendering into a single test - only separate tests when testing different states, behaviors, or edge cases.
- When a story references the qa-tester subagent for planning BDD scenarios, use the qa-tester subagent and instruct it to load BOTH skills in this order using the Skill tool:
  1. First: `story-flow:plan-bdd-scenarios` (plugin - general BDD planning protocol)
  2. Then: `plan-bdd-scenarios` (project-level - overrides/extends the plugin)
  3. Confirm both skills are loaded before continuing with BDD planning.

## Example Inputs

- Implement story according to @path/to/story.md
- Implement story markdown @path/to/story.md
- Implement story @path/to/story.md
- Implement @path/to/story.md
- Implement the following plan
- Implement this plan
- Execute this plan
- Proceed with implementation
