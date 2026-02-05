---
argument-hint: [@path/to/story.md, JIRA-123 (optional)]
description: Review a story markdown, optionally against a Jira story
---

Load BOTH skills in this order using the Skill tool:
1. First: `story-flow:review-story-against-jira` (plugin - general protocol)
2. Then: `review-story-against-jira` (project-level - overrides/extends the plugin)
3. Confirm both skills are loaded before continuing with the review.

If a Jira ticket is provided ($2):
  Review $1 against Jira story $2.
If no Jira ticket is provided:
  Review $1 without Jira comparison.
