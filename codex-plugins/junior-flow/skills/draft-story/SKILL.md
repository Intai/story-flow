---
name: draft-story
description: Draft technical story markdown from a tracker ticket or feature description.
---

# Draft a Story

Resolve an optional output story path and optional source from the user's request. Treat `PROJ-123`, `86d2uf1mh`, `4821`, and `AB#4821` as ticket IDs; a bare integer is always a ticket ID. Any other supplied source is a feature description.

Load skills in this order:

1. `junior-flow:draft-story-markdown` — plugin protocol
2. `draft-story-markdown` if it exists — project-level override or extension

Confirm which skills are loaded before continuing with the draft.

If a ticket ID is present, draft the story markdown from that ticket. If a feature description is present, draft the story markdown from that description. If neither is present, draft according to the plan.
