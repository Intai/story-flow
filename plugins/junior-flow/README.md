## Agentic Development Workflow Helpers for Junior Developers

A Claude plugin that helps junior developers learn the story-flow workflow.

### Prerequisites

- Install the Claude Code plugins:
  - [code-review@claude-plugins-official](https://github.com/anthropics/claude-code/blob/main/plugins/code-review)
  - [story-flow](https://github.com/Intai/story-flow#installation)
- Review story-flow's [prerequisites](https://github.com/Intai/story-flow#prerequisite).

### Learning Resources

Prompt Claude Code: `/learn-story-flow` for an interactive menu of topics. \
Available topics:
- Why discuss technical design before implementation?
- Why review implementation even with 100% test coverage?
- What defines effective, complete BDD scenarios?

### Review Implementation

🤖🧠 Stage your changes with `git add`, then prompt: `/code-review:code-review for staged changes` in **plan mode**. \
This audits changes by launching multiple agents independently from different perspectives as a starting point.

**Then:**
1. Understand the suggestions by reading the codebase.
2. Continue on story-flow [step 6](https://github.com/Intai/story-flow#steps) to review the implementation.

### Installation

Add the marketplace to Claude Code:
```
claude plugin marketplace add Intai/story-flow
```

Browse and install both plugins (story-flow and junior-flow):
```
/plugin
```
