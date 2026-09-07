---
name: analyze-tasks
description: Analyze task dependencies for parallel execution from a story markdown file.
---

# Analyze Story Task Dependencies

Resolve the story markdown path from the user's request. If it is absent, ask for it.

Load BOTH skills in this order:

1. `story-flow:analyze-task-dependencies` — plugin protocol
2. `analyze-task-dependencies` — project-level override or extension

Confirm both skills are loaded before continuing with the analysis.

Analyze task dependencies in the resolved story markdown file.
