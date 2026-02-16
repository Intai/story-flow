---
name: Analyze task dependencies for parallel execution
description: Parse story markdown to identify task dependencies and parallel execution opportunities.
user-invocable: false
---

# Analyze task dependencies for parallel execution

## Instructions

- Read the story markdown file using the Read tool.
- Parse all tasks from the "## Tasks" section.
- Analyze each task to identify dependencies:
  - **File dependencies**: Tasks that update/create files that other tasks depend on
  - **Logical dependencies**: Tasks that must complete before others
  - **Same-file conflicts**: Tasks that modify the same file cannot run in parallel
  - **Parallel agents**: Multiple agents of the same type can work in parallel - focus only on technical dependencies
  - **QA independence**: Test scenario planning tasks depend only on story and can start immediately in parallel with implementation tasks
- Group tasks into parallel execution batches using these formats:
  - `**Sequential tasks X-Y:**` for tasks that need to be implemented sequentially with no prerequisites
  - `**Sequential tasks X-Y after task Z completes:**` for a sequential chain that depends on one prerequisite task
  - `**Sequential tasks X-Y after tasks A-B complete:**` for a sequential chain that depends on multiple prerequisite tasks
  - `**Parallel tasks X-Y:**` for tasks with no dependencies that can start immediately
  - `**Parallel after task X completes:**` for parallel tasks depending on a single prerequisite task
  - `**Parallel after tasks X-Y complete:**` for parallel tasks depending on multiple prerequisite tasks
- Number tasks sequentially (1, 2, 3...) across all groups
- Keep the original task descriptions with their agent assignments and file paths

## Parallelism Strategy

When analyzing dependencies, prefer parallelism by default:
- Only create sequential dependencies when there's a true code-level dependency (file imports, component usage)
- Assume infrastructure and config will be ready at runtime
- Group tasks by file conflicts, not by logical workflow order
- Maximize the number of tasks that can start immediately
- Remember: multiple agents can work simultaneously on different files

## Output Format

Present the analysis as a proposed replacement for the "## Tasks" section. Do NOT edit the story file automatically.

Ask the user: "Would you like me to update the story file with these grouped tasks?"

Only edit the story file if the user confirms.

Proposed format:

```markdown
## Tasks

**Sequential tasks 1-3:**

1. Use backend-developer subagent to [original task description]
2. Use backend-developer subagent to [original task description]
3. Use backend-developer subagent to [original task description]

**Parallel tasks 4-5:**

4. Use backend-developer subagent to [original task description]
5. Use qa-tester subagent to [original task description]

**Parallel after task 4 completes:**

6. Use frontend-developer subagent to [original task description]
7. Use frontend-developer subagent to [original task description]

**Sequential tasks 8-9 after tasks 6-7 complete:**

8. Use backend-developer subagent to [original task description]
9. Use frontend-developer subagent to [original task description]
```

## Dependency Detection Rules

**Hard Dependencies (must wait):**
- Tasks that modify the same file cannot run in parallel (will cause merge conflicts)
- File creation must complete before files that import/reference them
- Store/state creation must complete before components that consume the store
- Component creation must complete before parent components that render them
- Server actions must complete before frontend components that call them

**Soft Dependencies (can assume will exist at runtime):**
- Config values and environment variables can be assumed to exist at runtime
- Database schemas/tables can be assumed to exist if mentioned in requirements
- API endpoints can be assumed to exist if defined in requirements
- Infrastructure (S3 buckets, etc.) can be assumed to exist if initialized separately

**Independent Tasks:**
- Test scenario planning depends only on story, not implementation
- Infrastructure setup (S3 initialization, DB migrations) can run in parallel with code
- Config changes can run in parallel with code that uses those configs

## Examples

### Config Dependencies

❌ **Over-sequential (incorrect approach):**
```
Sequential tasks 1-3:
1. Add config value `auth.userId`
2. Add config value `aws.s3.bucket`
3. Implement server action that uses both config values
```
This creates unnecessary waiting - task 3 can be written assuming configs will exist.

✅ **Properly parallel (correct approach):**
```
Sequential tasks 1-2:
1. Add config value `auth.userId`
2. Add config value `aws.s3.bucket`

Parallel tasks 3-4:
3. Implement server action that uses both config values
4. Initialize S3 bucket
```
Tasks 1-2 are sequential because they modify the same file. Tasks 3-4 can run in parallel with 1-2 because they assume runtime values will exist.

## Completion

This skill is a standalone analysis task. After updating the story file (or if the user declines):
- Report that the task dependency analysis is complete.
- Do NOT proceed to implementation planning, codebase exploration, or any other workflow phases.
- STOP and wait for the user's next instruction.

## Example Inputs

- Analyze task dependencies in @path/to/story.md
- Show parallel execution plan for @path/to/story.md
- What tasks can run in parallel in @path/to/story.md
- Group tasks by dependencies in @path/to/story.md
