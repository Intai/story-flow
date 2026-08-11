---
argument-hint: [@path/to/story.md, ticket ID e.g. PROJ-123, 4821 or feature description (optional)]
description: Generate a draft story markdown from a story tracker or a feature description
---

Load BOTH skills in this order using the Skill tool:
1. First: `junior-flow:draft-story-markdown` (plugin - general protocol)
2. Then: `draft-story-markdown` (project-level - overrides/extends the plugin)
3. Confirm both skills are loaded before continuing with the draft.

If $2 matches a ticket ID pattern (e.g. PROJ-123, 86d2uf1mh, 4821, AB#4821):
  Draft a story markdown $1 for story $2.
If $2 is provided but is not a ticket ID:
  Draft a story markdown $1 using "$2" as the feature description.
If $2 is not provided:
  Draft a story markdown $1 according to the plan.
