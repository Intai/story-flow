---
name: implement-story
description: Implement the requirements and tasks defined in a story markdown file.
---

# Implement a Story

Resolve the story markdown path from the user's request. If it is absent, ask for it.

Load BOTH skills in this order:

1. `story-flow:implement-story-markdown` — plugin protocol
2. `implement-story-markdown` — project-level override or extension

Confirm both skills are loaded before continuing with implementation.

Execute the tasks in the resolved story markdown file using the project's subagents. Use Context7.
