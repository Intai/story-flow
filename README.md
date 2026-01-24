## Agentic Development Workflow

This workflow leverages Claude Code to automate and streamline software development, from story planning to fully tested implementation. It helps teams maintain high-quality code, complete BDD coverage, and efficient task execution.

### Prerequisite

- Jira story readiness: The story has been groomed, refined, and story pointed. Acceptance criteria are clearly defined.
- Team alignment: All scrum team members understand the feature, including edge cases and expected outcomes.
- Login to Atlassian MCP.

### Steps

1. **Handcraft the technical story markdown** \
   Create a markdown file with requirements and tasks according to a Jira story, e.g. `src/onboarding/docs/onboarding-story.md` \
   **Important:**
   - Include a QA task to plan BDD scenarios.
   - Do not specify task dependencies at this stage; they will be analyzed later.

2. **Review the story markdown** \
   Prompt Claude Code: `/review-story INDY-123 @path/to/story.md` in **plan mode**. \
   This checks the story markdown against the Jira story.

3. **Update the story markdown** \
   Incorporate feedback to ensure the story is well-defined and detailed.

4. **Analyze task dependencies** \
   Prompt: `/analyze-tasks @path/to/story.md` starting from **plan mode**. \
   This identifies tasks that can be executed in parallel.

5. **Create an initial pull request** \
   Discuss story requirements, planned tasks, and execution plan with the team.

6. **Implement the story** \
   Prompt: `/implement-story @path/to/story.md` starting from **plan mode**. \
   Executes tasks according to the plan.

7. **Review implementation** \
   Check code, unit tests, and BDD scenarios line by line for:
   - Code quality
   - 100% test coverage
   - Full BDD coverage (positive, negative, edge cases)

8. **Execute BDD scenarios** \
   Prompt: `/execute-scenario SCENARIO-01 @path/to/file.feature` with accept-edits on. \
   Executes the BDD scenarios directly in the browser without coding.

9. **Confirm all scenarios pass**  

10. **Create the final pull request** \
   Discuss the fully tested implementation with the team.

11. **Optional: Generate a Playwright script** \
   Prompt: `/execute-scenario SCENARIO-01 @path/to/file.feature --record` with accept-edits on. \
   Generates a Playwright test script that can be run efficiently without Claude.
