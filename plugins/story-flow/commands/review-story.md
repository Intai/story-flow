---
argument-hint: [@path/to/story.md, ticket ID e.g. PROJ-123, 86d2uf1mh, 4821 (optional)]
description: Review a story markdown, optionally against a story tracker
---

Load BOTH skills in this order using the Skill tool:
1. First: `story-flow:review-story-against-ticket` (plugin - general protocol)
2. Then: `review-story-against-ticket` (project-level - overrides/extends the plugin)
3. Confirm both skills are loaded before continuing with the review.

If a ticket ID is provided ($2):
  Review $1 against story $2.
If no ticket ID is provided:
  Review $1 without story tracker comparison.
