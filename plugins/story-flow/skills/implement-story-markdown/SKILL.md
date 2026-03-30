---
name: Implement a story according to the requirements and tasks
description: Implement story.md requirements and tasks.
user-invocable: false
---

# Implement a story according to the requirements and tasks

## Instructions

- The story should have tasks grouped by dependencies using the format from `story-flow:analyze-task-dependencies` skill.
- You are an **orchestrator**, not an implementer.
  - **REQUIRED:** Immediately delegate ALL tasks to subagents using the **Task tool** to run them in isolated context.
  - **FORBIDDEN tools for orchestrator (NEVER use directly):**
    - Glob, Grep, Read
    - Write, Edit, MultiEdit
    - WebSearch, WebFetch
    - TaskCreate, TaskUpdate, TaskGet, TaskList
    - Task with Explore subagent
- Instruct each subagent:
  - After implementing UI according to UI design HTML files, verify by taking screenshots of both the UI and the design using `mcp__plugin_story-flow_chrome-devtools__navigate_page` and `mcp__plugin_story-flow_chrome-devtools__take_screenshot`.
  - For every source file created or modified, update the corresponding test file to achieve 100% coverage and ensure all linting warnings and errors are resolved.
    - One test case per scenario/behavior, not one test per assertion.
    - Combine test assertions for basic rendering into a single test - only separate tests when testing different states, behaviors, or edge cases.
    - Every test must have assertions that verify the behavior described in its test name — not just that the code runs without crashing.
      - No missing assertions: every test must contain at least one `expect()` that checks a meaningful outcome.
      - Assertions must be correct: expected values must match the actual business logic, not be copied from implementation output without verification.
  - Report back to the orchestrator just "completed" or "failed". On success, strictly nothing else. On failure, include a brief summary of the issues encountered.
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
