---
name: review-story
description: Review a story markdown file, optionally against a story tracker ticket.
---

# Review a Story

Resolve a required story markdown path and an optional ticket ID from the user's request. Recognize ticket IDs such as `PROJ-123`, `86d2uf1mh`, `4821`, and `AB#4821`. If the story path is absent, ask for it.

Load BOTH skills in this order:

1. `story-flow:review-story-against-ticket` — plugin protocol
2. `review-story-against-ticket` — project-level override or extension

Confirm both skills are loaded before continuing with the review.

If a ticket ID is present, review the resolved story markdown file against that story. Otherwise, review the file without story-tracker comparison.
