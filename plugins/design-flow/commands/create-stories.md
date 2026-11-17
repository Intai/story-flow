---
argument-hint: [sources: paths, folders, URLs or ticket IDs e.g. docs/feature/ kickoff.mp4 PROJ-120 (optional)]
description: Create epics and story-pointed stories in a story tracker from product and UI designs, transcripts and recordings
---

Load skills in this order using the Skill tool:
1. First: `design-flow:create-epic-stories` (plugin - general protocol)
2. Then: `create-epic-stories` if it exists (project-level - overrides/extends the plugin)
3. Confirm which skills are loaded before continuing.

If $ARGUMENTS is provided:
  Create the epic and stories from these sources: $ARGUMENTS
If $ARGUMENTS is not provided:
  Create the epic and stories from the sources discussed in this conversation.
