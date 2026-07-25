---
name: Review a story markdown against a Jira/ClickUp story
description: Analyze a Jira/ClickUp story to review story.md requirements and tasks.
user-invocable: false
---

# Review a story markdown against a Jira/ClickUp story

## Instructions

- Fetch the Jira/ClickUp issue by its ticket ID (e.g. PROJ-123, 86d2uf1mh) to retrieve the complete story details including description, acceptance criteria, and subtasks.
- Read the local story markdown file using the Read tool.
- Compare the Jira/ClickUp story content against the markdown file and identify discrepancies.
- Review the following aspects:
  - **Requirements Completeness**: Verify all Jira/ClickUp acceptance criteria and requirements are documented in the markdown.
  - **Task Breakdown**: Check that tasks in the markdown align with Jira/ClickUp story requirements and subtasks.
  - **Agent Assignments**: Ensure tasks have appropriate agent assignments (Use backend-developer subagent to, Use frontend-developer subagent to, etc.).
  - **Technical Accuracy**: Validate that the technical approach and implementation details match Jira/ClickUp specifications.
  - **Maintainability & Readability**: Assess whether each task, as scoped, promotes maintainable code. Using the similar existing implementations found during Codebase Verification, flag tasks that would duplicate logic that already exists (should reuse an existing utility/component instead), or that over- or under-engineer relative to the codebase's established patterns. Prefer pure, single-responsibility units with meaningful naming. Do NOT review implemented code here (none exists yet) — only the intent and scope of the planned tasks.
  - **Redundant Unit Testing Tasks**: Flag any tasks that are solely about writing or updating unit tests. Unit testing is automatically handled as part of each implementation task by the `implement-story-markdown` skill — separate testing tasks create duplication and should be removed or merged into the relevant implementation tasks.
  - **Task Dependency Ordering**: Do NOT flag missing explicit task dependency ordering or parallel/sequential grouping. This is handled separately by the `analyze-task-dependencies` skill.
- Report findings with specific examples of what's missing, incomplete, or misaligned.
- Highlight any requirements from Jira/ClickUp that are not reflected in the markdown.
- Note any tasks in the markdown that don't map to Jira/ClickUp requirements.
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

- Review @path/to/story.md against Jira/ClickUp story PROJ-123
- Compare Jira/ClickUp issue PROJ-123 with @path/to/story.md
- Validate that @path/to/story.md matches the Jira/ClickUp requirements for PROJ-123
- Check if the story file matches PROJ-123
