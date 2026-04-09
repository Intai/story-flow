---
name: Draft a story markdown from a Jira story or feature description
description: Generate a draft story markdown by analyzing a Jira story or feature description, Figma designs, and the codebase.
user-invocable: false
---

# Draft a story markdown from a Jira story or feature description

## Overview

This skill helps junior developers create technical story markdown by:
1. Gathering requirements from a Jira story or a provided feature description
2. Fetching Figma designs linked in the Jira story (when applicable)
3. Exploring the codebase to discover relevant files and patterns
4. Generating a draft `story.md` for the developer to review and refine

## Instructions

### Phase 1: Gather Requirements

#### Option A: Jira ticket provided

When the input is a Jira ticket ID (matching a pattern like `PROJ-123`):

- Use the Jira MCP tools to fetch the story by its ticket ID.
- Extract:
  - Summary (user story statement)
  - Description (context and background)
  - Acceptance criteria (requirements)
  - Subtasks (if any)
  - Figma links (URLs matching `figma.com/file/` or `figma.com/design/`)
- If the Jira fetch fails, inform the developer and ask them to verify:
  - The ticket ID is correct
  - They are logged into Atlassian MCP (`/mcp` to check status)

#### Option B: Feature description provided

When the input is a feature description (not a Jira ticket):

- Use the provided description as the basis for the story.
- Ask the developer clarifying questions if the description is too vague to derive requirements from, such as:
  - What is the expected user flow?
  - Are there specific acceptance criteria?
  - Are there any Figma designs to reference?
- Derive a user story summary, context, and initial requirements from the description and any clarifications.

### Phase 2: Explore Codebase

Use a **single comprehensive Explore agent** (Task tool with `subagent_type: Explore`) to discover:

1. **Project structure and conventions**
   - Directory organization (e.g., `src/`, `components/`, `api/`, `schemas/`)
   - File naming conventions (kebab-case, camelCase, PascalCase)
   - Common patterns (how similar features are structured)

2. **Files related to the feature area**
   - Search using keywords extracted from the Jira story summary and description
   - Look for existing files in the same domain/module
   - Identify files that will likely need modification

3. **Similar existing implementations**
   - Find reference patterns for the type of work (API endpoints, components, schemas)
   - Note how tests are organized for similar features

4. **Technical conventions**
   - Schema definitions and validation patterns
   - API route patterns and middleware usage
   - Component structure and state management approach

5. **Existing utility/helper patterns**
   - Locate utility or helper directories (e.g., `src/utils/`, `src/helpers/`, `lib/`)
   - Note naming conventions for shared modules
   - Identify reusable functions that already exist (validation, formatting, transformations)
   - Look for patterns where multiple modules import from the same shared location

**Exploration prompt template:**
```
Explore the codebase to help draft a story for: [SUMMARY FROM JIRA OR FEATURE DESCRIPTION]

Find:
1. Project structure - how are features organized?
2. Files related to: [KEYWORDS FROM REQUIREMENTS]
3. Similar implementations to use as reference patterns
4. Naming conventions for schemas, components, APIs, and tests
5. Where new files should be created based on existing patterns
6. Utility/helper directories and existing shared functions (validation, formatting, etc.)

Provide specific file paths and patterns discovered.
```

### Phase 3: Generate Draft

**Important:** Do not include unit test requirements or tasks in the story. Unit tests are automatically created during implementation with 100% coverage for every source file. Only include QA tasks for BDD scenario planning.

Create a story markdown with the following structure:

```markdown
[User story summary from Jira or feature description]

## Requirements

- [Requirement 1 from acceptance criteria or feature description]
- [Requirement 2 from acceptance criteria or feature description]
- [Additional requirements derived from Figma design]

## Tasks

- Use backend-developer subagent to [task description] @path/to/file.js. [Technical details].
- Use frontend-developer subagent to [task description] @path/to/component.jsx. [Technical details].
- Use qa-tester subagent to plan BDD scenarios @path/to/feature.feature.
```

**Task guidelines:**
- Each task should have:
  - Agent assignment (`Use backend-developer subagent to`, `Use frontend-developer subagent to`, `Use mobile-developer subagent to`, `Use qa-tester subagent to`)
  - Clear action description
  - Specific file path(s) using `@path/to/file` format
  - Technical details about what to implement
  - Relevant Figma links for reference, if available
- Group related work into single tasks when appropriate
- Always include a QA task for BDD scenarios
- Use existing file paths discovered during exploration
- For new files, follow the naming conventions discovered
- **Shared utility tasks:** When exploration reveals that two or more tasks will need the same logic (validation, formatting, data transformation), add a separate task to create the shared utility function before the tasks that use it. This avoids duplicating logic across tasks and keeps each task focused on a single responsibility.
  - Only create utility tasks when the shared pattern is genuinely identical across consumers — do not pre-emptively abstract similar-looking code that may diverge.
  - Place utility files in the project's existing utility directory (discovered during exploration, e.g., `src/utils/`, `src/helpers/`).
  - Name utility files by category (e.g., `validation.js`, `formatting.js`, `transforms.js`), not one function per file.
- **IMPORTANT: Do NOT add task dependency or ordering annotations** (e.g. "Parallel tasks 1-3:", "Sequential task N after task M completes:"). List tasks as unordered bullet points in any logical order. Task dependencies and parallel execution grouping are handled separately using the `analyze-task-dependencies` skill after the story is drafted. Note: existing story files in the codebase may already have dependency groupings added by that skill — do NOT copy that format when drafting.

**Using Figma design to inform content:**

When Figma design information is available:

1. **Derive requirements from design:**
   - Identify UI elements that imply requirements (e.g., an input field implies data storage)
   - Note validation needs from input types (email, phone, required fields)
   - Understand user flow from layout and component arrangement

2. **Inform task descriptions:**
   - Use component names from Figma (e.g., "ProfileCard", "EditNameModal")
   - Reference specific UI elements when describing frontend tasks
   - Identify new components that need to be created vs. existing ones to modify
   - Always include the Figma link for reference

**Agent assignment guide:**
- `Use backend-developer subagent to`: APIs, schemas, database models, server-side logic, backend services
- `Use frontend-developer subagent to`: React/Vue/Angular components, state management, UI logic, styling
- `Use mobile-developer subagent to`: React Native, iOS, Android native code, mobile-specific features
- `Use qa-tester subagent to`: BDD scenarios, test planning, feature files

### Phase 3b: Handle Unknown Files

If a requirement cannot be mapped to specific files:

1. **Ask the developer** using the AskUserQuestion tool:
   ```
   I couldn't identify where [requirement description] should be implemented.

   Based on my exploration, possible locations might be:
   - [Option A]: [path/to/possible/location]
   - [Option B]: [another/possible/location]

   Which file or module should handle this? Or should I create a new file?
   ```

2. Use the developer's guidance to complete the task description.

3. Document assumptions made for the developer to review.

### Phase 4: Present to Developer

1. **Show the complete draft markdown** in a code block.

2. **Highlight areas needing review:**
   - Tasks where file paths were uncertain (marked with assumptions)
   - Requirements that may need clarification
   - Any gaps between Jira acceptance criteria and generated tasks

3. **Suggest output path:**
   - If an output path was provided, use it
   - Otherwise, suggest based on codebase structure (e.g., `src/[module]/docs/[feature]-story.md`)

4. **Ask for confirmation** before writing the file:
   ```
   Would you like me to save this draft to [suggested/path/story.md]?

   Please review the draft and let me know if you'd like any changes before I save it.
   ```

5. **Write the file** only after the developer confirms.

## Example Output

```markdown
As a user, I want to update my profile name so that my account details are accurate.

## Requirements

- Allow the user to edit their display name.
- The display name is optional and has a maximum length of 100 characters.
- Display validation error if name exceeds 100 characters.
- Show character count below the input field (derived from Figma design).

## Tasks

- Use backend-developer subagent to create `validateDisplayName(name)` function in @src/account/utils/validation.js. Return error message or null. Pure function, no side effects. Max 100 characters.
- Use backend-developer subagent to add `displayName: String` field to user schema @src/account/schemas/user-schema.js. Use `validateDisplayName` from @src/account/utils/validation.js.
- Use backend-developer subagent to update user update API to handle displayName @src/account/api/user-api.js.
- Use frontend-developer subagent to create EditNameModal component with input field and character counter @src/account/components/edit-name-modal.jsx. Use `validateDisplayName` from @src/account/utils/validation.js for client-side validation. Match the modal design from Figma https://figma.com/design/abc123/ProfileEdit?node-id=1-234.
- Use frontend-developer subagent to update profile state management @src/account/redux/profile-slice.js.
- Use qa-tester subagent to plan BDD scenarios @src/account/docs/update-profile-name.feature.
```

## Example Inputs

- Draft story for JIRA-123
- Create story markdown from JIRA-456
- Generate technical story for JIRA-789 @src/feature/docs/story.md
- Draft JIRA-100 to @path/to/output.md
- Draft story for "Add dark mode support to the settings page"
- Draft story for "Implement user profile image upload"
