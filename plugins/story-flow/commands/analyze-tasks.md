---
argument-hint: [@path/to/story.md]
description: Analyze task dependencies for parallel execution
---

Load BOTH skills in this order using the Skill tool:
1. First: `story-flow:analyze-task-dependencies` (plugin - general protocol)
2. Then: `analyze-task-dependencies` (project-level - overrides/extends the plugin)

Do NOT proceed until both skills are loaded.

Analyze task dependencies in $ARGUMENTS.
