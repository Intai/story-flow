## Agentic Development Workflow Helpers for Junior Developers

A Claude plugin that helps junior developers learn the story-flow workflow.

### Prerequisites

- Install the Claude Code plugins:
  - [story-flow](https://github.com/Intai/story-flow#installation)

### Learning Resources

Prompt Claude Code: `/learn-story-flow` for an interactive menu of topics. \
Available topics:
- Why discuss technical design before implementation?
- Why review implementation even with 100% test coverage?
- What defines effective, complete BDD scenarios?

### Review Implementation

🤖🧠 Prompt: `/code-review max` in **plan mode**. This audits changes by launching multiple agents independently from different perspectives as a starting point.

**Then:**
1. Understand the suggestions by reading the codebase.
2. Continue on story-flow [step 6](https://github.com/Intai/story-flow#steps) to review the implementation.
3. When opening the PR, run `/prepare-implementation-review` (story-flow [step 9](https://github.com/Intai/story-flow#steps)) to help reviewers with discussion points, risks and evidence.

### Installation

Add the marketplace to Claude Code:
```
claude plugin marketplace add Intai/story-flow
```

Browse and install both plugins (story-flow and junior-flow):
```
/plugin
```
