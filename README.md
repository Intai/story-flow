## Agentic Development Workflow

This workflow leverages Claude Code to automate and streamline software development, from story planning to fully tested implementation. It helps teams maintain high-quality code, complete BDD coverage, and efficient task execution.

### Prerequisite

- Jira story readiness: The story has been groomed, refined, and story pointed. Acceptance criteria are clearly defined.

  > 💡 **Stories not ready yet?** Use [design-flow](plugins/design-flow) to explore product design, establish a style guide, and create UI designs collaboratively with Claude before grooming.

- Team alignment: All scrum team members understand the feature, including edge cases and expected outcomes.
- If you use Jira, login to Atlassian MCP and run `/mcp` to verify the connection status.

### Steps

1. 🧠 **Handcraft the technical story markdown** \
   Create a markdown file with requirements and tasks according to a Jira story, e.g. `src/onboarding/docs/onboarding-story.md`

   > 💡 **New to the codebase?** Use [junior-flow](plugins/junior-flow) to draft a story markdown from the Jira story as a starting point.

   **Important:**
   - Include a QA task to plan BDD scenarios.
   - Do not specify task dependencies at this stage; they will be analyzed later.
   - Include comprehensive technical details—this allows Claude to produce better, more reliable results without guessing.
   - Think first, code later. Handcrafting the story markdown ensures the technical design exists before a single line of code is written. This reduces rework and enables smooth parallel development.

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
   This checks the story markdown, optionally against a Jira story.

3. 🧠 **Update the story markdown** \
   Incorporate feedback to ensure the story markdown is well-defined and detailed.

4. 🤖 **Analyze task dependencies** \
   Prompt: `/analyze-tasks @path/to/story.md` starting from **plan mode**. \
   This identifies tasks that can be executed in parallel and updates the story markdown accordingly.

5. 🧠 **Create an initial pull request** \
   Discuss story requirements, planned tasks, and execution plan with the team.

6. 🤖 **Implement the story** \
   Prompt: `/implement-story @path/to/story.md` with accept-edits on. \
   Executes tasks according to the plan. Each task is delegated to a subagent running in an isolated context, keeping the orchestrator lightweight so it can handle larger stories without exhausting its context window. Tasks previously analyzed as independent will be implemented in parallel.

7. 🧠 **Review implementation** \
   Check code, unit tests, and BDD scenarios line by line for:
   - Code quality
   - 100% test coverage
   - Full BDD coverage (positive, negative, edge cases)
   - Test assertions match their descriptions (tests actually verify what they claim to test)

8. 🤖🧠 **Execute BDD scenarios** \
   Prompt: `/execute-scenario SCN-01 @path/to/file.feature` with accept-edits on. \
   Executes the BDD scenarios directly in the browser without coding. Confirm all scenarios pass.

9. 🧠 **Create the final pull request** \
   Discuss the fully tested implementation with the team.

10. 🤖 **Optional: Generate a Playwright script** \
    Prompt: `/execute-scenario all @path/to/file.feature --record` with accept-edits on. \
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
/plugin marketplace add Intai/story-flow
```

Browse and install plugins:
```
/plugin
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APPIUM_DEVICE_NAME` | Local device name or emulator | `emulator-5554` |
| `APPIUM_APP_PACKAGE` | Local app package unique identifier | - |
| `BROWSERSTACK_USERNAME` | BrowserStack username | - |
| `BROWSERSTACK_ACCESS_KEY` | BrowserStack access key | - |
| `BROWSERSTACK_APP_ID` | Uploaded app ID (`bs://...`) | - |

### Knowledge Sharing

If you discover skill improvements broadly useful to others, please share via pull requests. When submitting, please include context and examples so others can understand and apply your improvement. Thank you.
