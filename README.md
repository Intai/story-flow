## Agentic Development Workflow

This workflow leverages Claude Code to automate and streamline software development, from story planning to fully tested implementation. It helps teams maintain high-quality code, complete BDD coverage, and efficient task execution.

### Prerequisite

- Jira story readiness: The story has been groomed, refined, and story pointed. Acceptance criteria are clearly defined.
- Team alignment: All scrum team members understand the feature, including edge cases and expected outcomes.
- Login to Atlassian MCP.

### Steps

1. 🧠 **Handcraft the technical story markdown** \
   Create a markdown file with requirements and tasks according to a Jira story, e.g. `src/onboarding/docs/onboarding-story.md`

   **Important:**
   - Include a QA task to plan BDD scenarios.
   - Do not specify task dependencies at this stage; they will be analyzed later.
   - Think first, code later. Handcrafting the story ensures the technical design exists before a single line of code is written. This reduces rework and enables smooth parallel development.

   Example:
   ```markdown
   As a user, I want to update my profile name so that my account details are accurate.

   ## Requirements

   - Allow the user to edit their display name.
   - The display name is optional and has a maximum length of 100 characters.

   ## Tasks

   - @agent-backend-developer Add `displayName: String` to the user schema @src/account/schemas/user-schema.js.
   - @agent-frontend-developer Add a Display Name input field with validation to the profile form @src/account/components/profile-form.jsx and update state management @src/account/redux/profile-slice.js.
   - @agent-qa-tester Plan BDD scenarios @src/account/docs/update-profile-name.feature.
   ```

2. 🤖 **Review the story markdown** \
   Prompt Claude Code: `/review-story JIRA-123 @path/to/story.md` in **plan mode**. \
   This checks the story markdown against the Jira story.

3. 🧠 **Update the story markdown** \
   Incorporate feedback to ensure the story is well-defined and detailed.

4. 🤖 **Analyze task dependencies** \
   Prompt: `/analyze-tasks @path/to/story.md` starting from **plan mode**. \
   This identifies tasks that can be executed in parallel and updates the story markdown accordingly.

5. 🧠 **Create an initial pull request** \
   Discuss story requirements, planned tasks, and execution plan with the team.

6. 🤖 **Implement the story** \
   Prompt: `/implement-story @path/to/story.md` starting from **plan mode**. \
   Executes tasks according to the plan.

7. 🧠 **Review implementation** \
   Check code, unit tests, and BDD scenarios line by line for:
   - Code quality
   - 100% test coverage
   - Full BDD coverage (positive, negative, edge cases)

8. 🤖🧠 **Execute BDD scenarios** \
   Prompt: `/execute-scenario SCN-01 @path/to/file.feature` with accept-edits on. \
   Executes the BDD scenarios directly in the browser without coding. Confirm all scenarios pass.

9. 🧠 **Create the final pull request** \
   Discuss the fully tested implementation with the team.

10. 🤖 **Optional: Generate a Playwright script** \
   Prompt: `/execute-scenario all @path/to/file.feature --record` with accept-edits on. \
   Generates a Playwright test script that can be run efficiently without Claude for regression testing.
