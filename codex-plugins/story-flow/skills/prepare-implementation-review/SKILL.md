---
name: prepare-implementation-review
description: Post reviewer-facing evidence on a pull request.
---

# Prepare a Pull Request for Review

Resolve optional PR URLs or a PR ID, an optional story markdown path and an optional `--dry-run` flag from the user's request. Without either, use the current branch's PR.

Load skills in this order:

1. `story-flow:prepare-implementation-review-comments` — plugin protocol
2. `prepare-implementation-review-comments` if it exists — project-level override or extension

Confirm which skills are loaded before continuing.

Prepare the resolved pull requests for review.
