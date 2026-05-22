---
argument-hint: [@path/to/story.md, JIRA-123 or feature description (optional)]
description: Generate a draft story markdown from a Jira/ClickUp story or a feature description
---

Load BOTH skills in this order using the Skill tool:
1. First: `junior-flow:draft-story-markdown` (plugin - general protocol)
2. Then: `draft-story-markdown` (project-level - overrides/extends the plugin)
3. Confirm both skills are loaded before continuing with the draft.

If $2 matches a Jira/ClickUp ticket pattern (e.g. PROJ-123, 86d2uf1mh):
  Draft a story markdown $1 for Jira/ClickUp story $2.
If $2 is provided but is not a Jira/ClickUp ticket:
  Draft a story markdown $1 using "$2" as the feature description.
If $2 is not provided:
  Draft a story markdown $1 according to the plan.
