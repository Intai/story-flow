## Agentic Development Workflow

This workflow leverages Claude Code to automate and streamline software development, from story planning to fully tested implementation. It helps teams maintain high-quality code, complete BDD coverage, and efficient task execution.

### Prerequisite

- Jira/ClickUp story readiness: The story has been groomed, refined, and story pointed. Acceptance criteria are clearly defined.

  > 💡 **Stories not ready yet?** Use [design-flow](plugins/design-flow) to explore product design, establish a style guide, create UI designs, and break the feature into epics and stories collaboratively with Claude before grooming.

- Team alignment: All scrum team members understand the feature, including edge cases, error handling, and expected outcomes.
- If you use Jira/ClickUp, login to Atlassian/ClickUp MCP and run `/mcp` to verify the connection status.

### Steps

1. 🤖🧠 **Create the technical story markdown** \
   Create a markdown file with requirements and tasks according to a Jira/ClickUp story, e.g. `src/onboarding/docs/onboarding-story.md`

   > 💡 **New to the codebase or short on time?** Use [junior-flow](plugins/junior-flow) to draft a story markdown from the Jira/ClickUp story as a starting point.

   **Important:**
   - Include a QA task to plan BDD scenarios.
   - Do not specify task dependencies at this stage; they will be analyzed later.
   - Include comprehensive technical details—this allows Claude to produce better, more reliable results without guessing.
   - Think first, code later. Creating the story markdown ensures the technical design exists before a single line of code is written. This reduces rework and enables smooth parallel development.

   Example:
   ```markdown
   As a user, I want to update my profile name so that my account details are accurate.

   ## Requirements

   - Allow the user to edit their display name.
   - The display name is optional and has a maximum length of 100 characters.

   ## Tasks

   - Use backend-developer subagent to add `displayName: String` to the user schema @src/account/schemas/user-schema.js.
   - Use frontend-developer subagent to add a Display Name input field with validation to the profile form @src/account/components/profile-form.jsx and update state management @src/account/redux/profile-slice.js.
   - Use qa-tester subagent to plan BDD scenarios @src/account/docs/update-profile-name.feature.
   ```

2. 🤖 **Review the story markdown** \
   Prompt Claude Code: `/review-story @path/to/story.md JIRA-123` in **plan mode**. \
   This checks the story markdown, optionally against a Jira/ClickUp story.

3. 🧠 **Update the story markdown** \
   Incorporate feedback to ensure the story markdown is well-defined and detailed.

4. 🤖 **Analyze task dependencies** \
   Prompt: `/analyze-tasks @path/to/story.md` starting from **plan mode**. \
   This identifies tasks that can be executed in parallel and updates the story markdown accordingly.

5. 🧠 **Create an initial pull request** \
   Open a PR with the story markdown and discuss requirements, planned tasks, and the execution plan with the team **before any code is written**.

   > 💡 **Why now?** Shift-left: a wrong approach caught here costs a review comment; caught after implementation it costs the implementation. Use [junior-flow](plugins/junior-flow) `/learn-story-flow technical-design` to explore why design PRs reduce rework.

   **Important:**
   - Include alternatives considered and open questions for reviewers.
   - Designs evolve; update the story markdown when implementation diverges.

6. 🤖 **Implement the story** \
   Prompt: `/implement-story @path/to/story.md` in **auto mode**. \
   Executes tasks according to the plan in loops until the acceptance criteria are met. Each task is delegated to a subagent running in an isolated context, keeping the orchestrator lightweight so it can handle larger stories without exhausting its context window. Tasks previously analyzed as independent will be implemented in parallel.

7. 🧠 **Review implementation** \
   Check code, unit tests, and BDD scenarios for:
   - Code quality
   - 100% test coverage
   - Full BDD coverage (positive, negative, edge cases)
   - Test assertions match their descriptions (tests actually verify what they claim to test)

8. 🤖🧠 **Execute BDD scenarios** \
   Prompt: `/execute-scenario SCN-01 @path/to/file.feature` in **auto mode**. \
   Executes the BDD scenarios directly in the browser without coding. Confirm all scenarios pass.

9. 🧠 **Create the final pull request** \
   Discuss the fully tested implementation with the team.

10. 🤖 **Optional: Generate a Playwright script** \
    Prompt: `/execute-scenario all @path/to/file.feature --record` in **auto mode**. \
    Generates a Playwright test script that can be run efficiently without Claude for regression testing.

    **Troubleshoot Recording Issues** \
    If the recording produces unreliable or incomplete Playwright tests, try the following (in order):
    1. Make BDD steps more specific \
       Clarify intent and expected outcomes so Claude doesn’t need to infer behavior.
    2. Add stable UI selectors \
       Prefer explicit identifiers such as accessibilityId, data-testid, or similar attributes on key elements.
    3. Add domain knowledge to Claude skills (last resort) \
       If ambiguity remains, extend Claude with relevant domain context via [custom skills](#extension).

    After applying any of the above, simply regenerate the Playwright test cases.

### Extension

Extend the workflow with your own domain knowledge by adding custom skills. \
Each skill must follow the exact naming convention so the agent can discover and use it.

Example:
- `.claude/skills/review-story-against-jira/SKILL.md`
- `.claude/skills/analyze-task-dependencies/SKILL.md`
- `.claude/skills/implement-story-markdown/SKILL.md`
- `.claude/skills/plan-bdd-scenarios/SKILL.md`
- `.claude/skills/execute-bdd-scenario/SKILL.md`

### Installation

Add this marketplace to Claude Code:
```
claude plugin marketplace add Intai/story-flow
```

Browse and install plugins:
```
/plugin
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Base URL of the app under test | `use.baseURL` in `playwright.config.js` |
| `APPIUM_DEVICE_NAME` | Local device name or emulator | `emulator-5554` |
| `APPIUM_APP_PACKAGE` | Local app package unique identifier | - |
| `BROWSERSTACK_USERNAME` | BrowserStack username | - |
| `BROWSERSTACK_ACCESS_KEY` | BrowserStack access key | - |
| `BROWSERSTACK_APP_ID` | Uploaded app ID (`bs://...`) | - |
| `VRT_APIURL` | VRT backend API URL | `http://localhost:4200` |
| `VRT_PROJECT` | VRT project name or ID | - |
| `VRT_APIKEY` | VRT user API key | - |
| `VRT_BRANCHNAME` | Baseline branch | Current git branch |
| `VRT_CIBUILDID` | Groups every worker's run into one VRT build | Current git SHA |
| `VRT_ENABLESOFTASSERT` | `true` = collect diffs without failing the test; review in the UI | `true` |

`BASE_URL` selects the environment to run against. The project's `playwright.config.js` reads it into `use.baseURL` with a local default, so scenarios and recorded specs navigate with relative paths (`page.goto('/settings')`) and one spec runs unchanged against dev, QA, staging or production. Skip starting the local dev server when it points at a remote host:

```javascript
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'
const isRemote = !baseURL.includes('localhost')

export default defineConfig({
  use: { baseURL },
  ...(isRemote ? {} : { webServer: [{ command: 'make dev-bg', url: baseURL }] }),
})
```

The `VRT_*` variables enable visual regression testing for `@screenshots` scenarios recorded with `--record`. Screenshots are compared against approved baselines in a self-hosted [Visual Regression Tracker](https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker) instance, which provides a web UI to approve or reject diffs — standing up that instance is the project's responsibility. Tracking activates only when `VRT_APIURL`, `VRT_APIKEY`, and `VRT_PROJECT` are all set; otherwise `@screenshots` still captures screenshots, just untracked.

### BDD Tags

Tags on a `Feature:` or `Scenario:` line control execution behaviour.

| Tag | Effect |
|-----|--------|
| `@purge-data` | Restores seed data (`make reseed`) before the scenario runs |
| `@screenshots` | Takes a screenshot after every assertion step; tracked for visual regression when the `VRT_*` variables are set |
| `@timeout-*` | Extends the scenario timeout, e.g. `@timeout-600s` for 10 minutes |

Every tag is appended to the generated test name — including ones with no built-in behaviour, such as environment tags like `@staging` and `@prod` — so Playwright can filter on them:

```bash
BASE_URL=https://staging.example.com npx playwright test --grep "@staging"
npx playwright test --grep-invert "@purge-data"   # skip destructive scenarios on a shared environment
npx playwright test --grep-invert "@timeout-"     # skip slow scenarios
```

### Knowledge Sharing

If you discover skill improvements broadly useful to others, please share via pull requests. When submitting, please include context and examples so others can understand and apply your improvement. Thank you.
