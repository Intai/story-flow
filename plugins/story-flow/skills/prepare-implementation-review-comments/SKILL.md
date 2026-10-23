---
name: Prepare implementation review comments on a pull request
description: Post reviewer-facing evidence on a pull request - reading order, requirement traceability, risks, discussion points, screenshots, API calls, BDD results and unit coverage.
user-invocable: false
---

# Prepare implementation review comments on a pull request

## Overview

Helps reviewers by posting, as one review on each pull request:
- inline comments on the lines they concern: risks, discussion points, screenshots, accessibility violations, API calls, failed BDD scenarios and coverage gaps
- a summary of what belongs to no single line: TL;DR, reading order, requirement traceability, BDD results and coverage

## Instructions

### Phase 1: Find the code host

- Work out the host from each PR URL given, else from `git remote get-url origin` (e.g. GitHub, Azure DevOps, GitLab).
- For each operation below, use the host's MCP server tools if the project has one, else the host's CLI (e.g. `gh`, `az repos`, `glab`), else its REST API through `curl` with a token from the environment. If none works, tell the developer what to install or log into (`/mcp` to check status) and stop — never guess.
- Operations:
  - Read the PR: number, author, URL, changed files, head commit and diff.
  - List the PR's existing comments, to find ones carrying a `<!-- story-flow:prepare-implementation-review... -->` marker.
  - Post a review: a summary body with inline comments, each on a file and a line on the new side of the diff. Where the host has no single review, post the summary and each inline comment separately (e.g. Azure DevOps threads, GitLab discussions).
  - Post a file-level comment, where the host supports one (e.g. GitHub `subject_type: file`).
  - Edit a comment.
  - Link to a file and line in the PR.
  - Host an image for a comment. Use the host's upload where it has one (e.g. Azure DevOps PR attachments, GitLab project uploads). Otherwise (e.g. GitHub), commit it to a `pr-evidence` orphan branch through a temporary `git worktree`, so the developer's checkout is untouched, push, and link the raw file at that commit.

### Phase 2: Gather

- Resolve the PRs: each given URL (ignoring trailing segments such as `/changes` or `/files`) or ID, else the PR whose source branch is the current branch. Several PRs are one story split across repositories; prepare them together.
- For a URL in another repository, find its local clone: a sibling of the current repository whose `git remote get-url origin` matches it. If there is none, ask the developer for its path. Run everything for that PR in its clone.
- Read each PR. If `git rev-parse HEAD` in its clone isn't its head commit, ask the developer to check it out (e.g. `git checkout <head commit>` for a merged PR whose branch is gone) and stop — never switch branches or stash on their behalf.
- Find the story markdown and `.feature` files among the changed files of all the PRs, or use the story path given.
- Every item below belongs to the PR whose diff holds its line. Requirement traceability and reading order span all the PRs: a requirement met in another PR links there rather than being marked ❌, and the reading order starts at the PR holding the `.feature`.
- **Risks**: changes where a mistake would break behaviour beyond this story, such as a schema or public API contract, a data migration or persisted-state shape, authentication, authorisation or payments, or a shared component or utility with other callers. Each risk is anchored to the changed line that carries it and says what could break.
- **Blast radius**: for each changed export imported outside the PR, Grep for its callers. Give the caller count and up to five caller paths. Attach it to the risk on that export, or make it a risk when there are callers the PR doesn't touch.
- **Discussion points**: choices in the change a reviewer could reasonably dispute, such as departing from an existing pattern or a sibling implementation that does the same job, a new pattern, abstraction or dependency, fetching more data than it displays, a TODO, workaround or temporary check, or meeting a requirement in only one of its readings. Each is a question for reviewers, anchored to the hunk that makes the choice.
- **Requirement traceability** (only with a story markdown): for each requirement, the hunks that implement it (linked) and the scenario IDs that prove it. Mark ❌ a requirement with no code or no scenario, and ⚠️ a hunk that maps to no requirement.
- **Reading order**: changed files in the order to review them — `.feature` scenarios (the intended behaviour), then contracts and types, logic, UI, and unit tests. Start at contracts when no `.feature` changed. List skim-only files separately with the reason: recorded `.spec.js` files, lockfiles, generated code, snapshots, pure renames or moves (`git diff -M --stat`) and whitespace-only changes (`git diff -w`).

### Phase 3: Evidence

- **BDD results**: the scenarios added or changed in the PR's `.feature` files. Run them through their recorded `.spec.js` filtered to their IDs (e.g. `npx playwright test <spec> --grep "<ID>:"`), or through `/execute-scenario` for scenarios not recorded yet. Note which way each ran.
- **Screenshots**: one for each changed hunk that renders something, such as a change to a component's markup. Logic-only hunks get none.
  - Trace the component's usages up to the screen that shows it. Reach that screen and state through the steps and stubs of a changed scenario that passes through it, else navigate there directly. When the hunk adds a state, such as an error, empty or loading view, bring the app into that state.
  - Drive the app with `mcp__plugin_story-flow_playwright__*` tools, or `mcp__plugin_story-flow_appium__*` for a mobile app, signed in as the scenario's user, with the base URL and project skills `/execute-scenario` would use.
  - When the hunk only renders inside another PR's app (e.g. a shared package), run that app with this PR's clone linked in, as the project skills describe.
  - Take an element screenshot of the changed component, not the full page. Save it to the scratchpad as `<component>-<state>.png`.
  - In a web app, run axe-core on the same component and state, and keep each violation on markup the hunk changes, naming the rule and the element.
- **API calls**: one for each changed hunk whose behaviour an API response shows, such as a service, handler or query change, and one more for each error branch the hunk adds (e.g. validation returning 400, a missing record returning 404).
  - Run the matching request from a changed scenario when one exists. Otherwise trace the changed code up to its endpoint (e.g. a controller action or function route) and build a request that exercises the change.
  - Send it with the base URL and token the project skills or environment provide. When neither is available, write it as a ready-to-run `curl` instead.
  - Keep the method, path, status and the part of the response body the change affects (e.g. the ordering, a new field, a status code). Redact the `Authorization` header and any token.
- **Unit coverage**: run only the unit tests related to the changed non-test source files, not the whole suite, which already ran when the PR was created, with coverage scoped to those files (e.g. `npx vitest related <files> --run --coverage --coverage.include=<file>`, `npx jest --findRelatedTests <files> --coverage --collectCoverageFrom=<file>`, `dotnet test --filter "FullyQualifiedName~<Class>Tests" --collect:"XPlat Code Coverage"`). Keep the tool's raw per-file text table (lines, branches, functions, uncovered line numbers), cut to the changed files.

### Phase 4: Draft

Write each PR's review to files in the scratchpad. Refer to a PR in another repository as `<owner>/<repo>#<number>` or its URL, never a bare `#<number>`, which the host links to the current repository.

- **Inline comments**, each ending with `<!-- story-flow:prepare-implementation-review:<kind> -->`:

  | Kind | Anchored to |
  |---|---|
  | `risk` | The changed line carrying the risk, with its blast radius |
  | `discussion` | The hunk that makes the choice |
  | `screenshot` | The last changed line of the hunk, with one line saying what it shows, then the image |
  | `accessibility` | The changed line rendering the element, naming the axe-core rule and what fails |
  | `api` | The last changed line of the hunk, with one line saying what the response shows, then the request and the trimmed response, or the `curl` to run |
  | `bdd` | Only a ❌ scenario: its `Scenario:` line, with how it ran and what failed |
  | `coverage` | The first uncovered line of a changed file under 100%, listing its other uncovered ranges |

  An item whose line isn't in the diff, and that the host can't put in a file-level comment, goes in the summary instead.

- **Summary**, ending with `<!-- story-flow:prepare-implementation-review -->`:
  1. TL;DR: what the change does and why in one or two lines, from the story markdown or the story's tracker item, linking the tracker item
  2. Reading order
  3. Requirement traceability
  4. BDD results: one table of every scenario that ran, with ✅ or ❌ and how it ran, in the summary of the PR holding the `.feature`. The other PRs link to it rather than repeat it
  5. Coverage in one line (e.g. "9 files, all 100%", or the count under 100% linking to their inline comments), then a `<details>` block with the exact command, the commit it ran on and the raw table
  6. The number of inline comments of each kind
  7. Links to the other PRs of the story

  Use `<details>` for any section longer than about ten lines. Leave out a section with nothing in it.

### Phase 5: Post

- With `--dry-run`, show the drafts for all the PRs to the developer, with screenshots as their local paths, and stop.
- Host the screenshots, then put their links into the drafts.
- When an earlier run's comments exist, edit the summary and each inline comment whose kind and anchor still apply, and post the rest fresh.
- Post the rest of each PR's comments as one review where the host supports it, then give the review URLs.

## Example Inputs

- Prepare PR 123 for review
- Prepare https://github.com/org/api-repo/pull/123 for review
- Prepare https://github.com/org/package-repo/pull/45 and https://github.com/org/app-repo/pull/123 for review
- Prepare the current branch's PR for review --dry-run
- Prepare PR 123 for review with @path/to/story.md
