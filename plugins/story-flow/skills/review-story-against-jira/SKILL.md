---
name: Review a story markdown against a Jira story
description: Analyze a Jira story to review story.md requirements and tasks.
---

# Review a story markdown against a Jira story

## Instructions

- Fetch the Jira issue by its ticket ID (e.g., JIRA-2070) to retrieve the complete story details including description, acceptance criteria, and subtasks.
- Read the local story markdown file using the Read tool.
- Compare the Jira story content against the markdown file and identify discrepancies.
- Review the following aspects:
  - **Requirements Completeness**: Verify all Jira acceptance criteria and requirements are documented in the markdown.
  - **Task Breakdown**: Check that tasks in the markdown align with Jira story requirements and subtasks.
  - **Agent Assignments**: Ensure tasks have appropriate agent mentions (@agent-backend-developer, @agent-frontend-developer, etc.).
  - **Technical Accuracy**: Validate that the technical approach and implementation details match Jira specifications.
- Report findings with specific examples of what's missing, incomplete, or misaligned.
- Highlight any requirements from Jira that are not reflected in the markdown.
- Note any tasks in the markdown that don't map to Jira requirements.

## Example Inputs

- Review @path/to/story.md against Jira story JIRA-2070
- Compare Jira issue JIRA-2070 with @path/to/story.md
- Validate that @path/to/story.md matches the Jira requirements for JIRA-2070
- Check if the story file matches JIRA-2070
