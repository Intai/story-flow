---
name: Review a story markdown against a story tracker
description: Analyze a story from the story tracker to review story.md requirements and tasks.
user-invocable: false
---

# Review a story markdown against a story tracker

## Instructions

- Fetch the story by its ticket ID (e.g. PROJ-123, 86d2uf1mh, 4821) using the project's story tracker MCP tools (Jira, ClickUp, Azure DevOps), to retrieve the complete story details including description, acceptance criteria, and subtasks, and download its attachments. If no story tracker MCP tool is available, tell the developer the project has no story tracker MCP server configured (`/mcp` to check status) and ask them to paste the story details or drop the ticket argument — never guess at the story content.
- For a bug ticket, also extract the steps to reproduce, and the actual and expected behaviour. Review the downloaded attachments for details the description omits.
- If the ticket is a bug, reproduce it before reviewing. Follow its steps to reproduce by driving the app with `mcp__plugin_story-flow_playwright__*` tools, or `mcp__plugin_story-flow_appium__*` for a mobile app. Navigate relative to the base URL from `BASE_URL`, falling back to `use.baseURL` in the project's @playwright.config.js. Note the failing step, the actual behaviour and any console or network errors.
- If the bug does not reproduce, carry on reviewing and report it as a finding for the developer to confirm the environment, version, account or seed data.
- Read the local story markdown file using the Read tool.
- Compare the story content against the markdown file and identify discrepancies.
- Review the following aspects:
  - **Requirements Completeness**: Verify all acceptance criteria and requirements from the story are documented in the markdown.
  - **Task Breakdown**: Check that tasks in the markdown align with the story requirements and subtasks.
  - **Agent Assignments**: Ensure tasks have appropriate agent assignments (Use backend-developer subagent to, Use frontend-developer subagent to, etc.).
  - **Technical Accuracy**: Validate that the technical approach and implementation details match the story specifications.
  - **Root Cause Coverage** (bug tickets): Using the reproduction findings, verify the tasks address the failing step and any console or network errors observed — flag tasks that only treat the symptom described in the ticket.
  - **Maintainability & Readability**: Assess whether each task, as scoped, promotes maintainable code. Using the similar existing implementations found during Codebase Verification, flag tasks that would duplicate logic that already exists (should reuse an existing utility/component instead), or that over- or under-engineer relative to the codebase's established patterns. Prefer pure, single-responsibility units with meaningful naming. Do NOT review implemented code here (none exists yet) — only the intent and scope of the planned tasks.
  - **Redundant Unit Testing Tasks**: Flag any tasks that are solely about writing or updating unit tests. Unit testing is automatically handled as part of each implementation task by the `implement-story-markdown` skill — separate testing tasks create duplication and should be removed or merged into the relevant implementation tasks.
  - **Task Dependency Ordering**: Do NOT flag missing explicit task dependency ordering or parallel/sequential grouping. This is handled separately by the `analyze-task-dependencies` skill.
- Report findings with specific examples of what's missing, incomplete, or misaligned.
- Highlight any requirements from the story that are not reflected in the markdown.
- Note any tasks in the markdown that don't map to the story requirements.
- **Task Implementation Summary**: For each task in the markdown, provide a summary of what will be implemented:
  - Describe the key changes, features, or components that will be built
  - **Codebase Verification**:
    - For files to modify: Confirm they exist and identify relevant code sections
    - For new files: Verify target directories exist and check naming conventions against similar files
    - For dependencies: Check that referenced modules, components, or APIs exist
    - Identify similar existing implementations as reference patterns
  - **Implementability Assessment**: Mark each task as:
    - ✅ **Doable** - Can be implemented as described
    - ⚠️  **Needs Adjustment** - Feasible with modifications (explain what)
    - ❌ **Blocked** - Cannot be implemented (list blockers)

## Example Inputs

- Review @path/to/story.md against story PROJ-123
- Compare story 86d2uf1mh with @path/to/story.md
- Validate that @path/to/story.md matches the requirements for 4821
- Check if the story file matches PROJ-123
