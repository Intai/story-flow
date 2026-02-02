## Agentic Development Workflow Helpers for Junior Developers

A Claude plugin that helps junior developers create technical story markdown from Jira story. This plugin automates the most challenging part of the story-flow workflow for developers who are new to a codebase.

### Prerequisites

- Install the Claude Code plugins:
  - [code-review@claude-plugins-official](https://github.com/anthropics/claude-code/blob/main/plugins/code-review)
  - [story-flow](https://github.com/Intai/story-flow#installation)
- Review story-flow's [prerequisites](https://github.com/Intai/story-flow#prerequisite).

### Learning Resources

Prompt Claude Code: `/learn-story-flow` for an interactive menu of topics. \
Available topics:
- Why discuss technical design before implementation?
- What defines effective, complete BDD scenarios?

### Steps

1. 🤖🧠 **Draft the technical story markdown** \
   Prompt Claude Code: `/draft-story JIRA-123 @path/to/story.md` with accept-edits on. \
   This generates a draft story markdown from a Jira story as a starting point.

   **Then:**
   1. Understand the drafted tasks technically by reading the codebase.
   2. Continue on story-flow [step 1](https://github.com/Intai/story-flow#steps) to review and refine the story markdown.

… 2-6. Follow story-flow [steps 2-6](https://github.com/Intai/story-flow#steps)

7. 🤖🧠 **Review implementation** \
   Stage your changes with `git add`, then prompt: `/code-review:code-review for staged changes` in **plan mode**. \
   This audits changes by launching multiple agents independently from different perspectives as a starting point.

   **Then:**
   1. Understand the suggestions by reading the codebase.
   2. Continue on story-flow [step 7](https://github.com/Intai/story-flow#steps) to review the implementation.

… 8-10. Follow story-flow [steps 8-10](https://github.com/Intai/story-flow#steps)

### Installation

Add the marketplace to Claude Code:
```
/plugin marketplace add Intai/story-flow
```

Browse and install both plugins (story-flow and junior-flow):
```
/plugin
```
