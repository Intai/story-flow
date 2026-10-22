---
argument-hint: [PR URLs or ID (optional, defaults to the current branch's PR), @path/to/story.md (optional), --dry-run (optional)]
description: Post reviewer-facing evidence on a pull request
---

Load skills in this order using the Skill tool:
1. First: `story-flow:prepare-implementation-review-comments` (plugin - general protocol)
2. Then: `prepare-implementation-review-comments` if it exists (project-level - overrides/extends the plugin)
3. Confirm which skills are loaded before continuing.

Prepare pull requests $ARGUMENTS for review.
