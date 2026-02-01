---
argument-hint: [JIRA-123, @path/to/story.md (optional)]
description: Generate a draft story markdown from a Jira story
---

Load BOTH skills in this order using the Skill tool:
1. First: `junior-flow:draft-story-markdown` (plugin - general protocol)
2. Then: `draft-story-markdown` (project-level - overrides/extends the plugin)
3. Confirm both skills are loaded before continuing with the draft.

Draft a story markdown for Jira story $1. Output path: $2 (optional - suggest based on codebase structure if not provided).
