---
name: Review a story markdown against a Jira story
description: Analyze a Jira story to review story.md requirements and tasks.
user-invocable: false
---

# Review a story markdown against a Jira story

## Instructions

- Fetch the Jira issue by its ticket ID (e.g., JIRA-2070) to retrieve the complete story details including description, acceptance criteria, and subtasks.
- Read the local story markdown file using the Read tool.
- Compare the Jira story content against the markdown file and identify discrepancies.
- Review the following aspects:
  - **Requirements Completeness**: Verify all Jira acceptance criteria and requirements are documented in the markdown.
  - **Task Breakdown**: Check that tasks in the markdown align with Jira story requirements and subtasks.
  - **Agent Assignments**: Ensure tasks have appropriate agent assignments (Use backend-developer subagent to, Use frontend-developer subagent to, etc.).
  - **Technical Accuracy**: Validate that the technical approach and implementation details match Jira specifications.
  - **Redundant Unit Testing Tasks**: Flag any tasks that are solely about writing or updating unit tests. Unit testing is automatically handled as part of each implementation task by the `implement-story-markdown` skill — separate testing tasks create duplication and should be removed or merged into the relevant implementation tasks.
  - **Task Dependency Ordering**: Do NOT flag missing explicit task dependency ordering or parallel/sequential grouping. This is handled separately by the `analyze-task-dependencies` skill.
- Report findings with specific examples of what's missing, incomplete, or misaligned.
- Highlight any requirements from Jira that are not reflected in the markdown.
- Note any tasks in the markdown that don't map to Jira requirements.
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

- Review @path/to/story.md against Jira story JIRA-2070
- Compare Jira issue JIRA-2070 with @path/to/story.md
- Validate that @path/to/story.md matches the Jira requirements for JIRA-2070
- Check if the story file matches JIRA-2070
