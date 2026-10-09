import { describe, expect, test } from 'claude-code/testing'

import {
  describeTask,
  parseStoryDispatches,
  parseTaskGroups,
  parseTaskNumber,
  parseTaskResult,
  parseTaskVerdict,
} from './parse'
import {
  assignTaskAgent,
  claimStoryOwner,
  countTasks,
  describeProgress,
  findTaskByAgent,
  markTaskRunning,
  recordTaskResult,
  startStory,
  storyTitle,
} from './run'

const STORY = `As a farmer I want orders to open instantly.

## Requirements

- Open orders from the list's copy

## Tasks

**Sequential tasks 1-2, no prerequisites:**

1. Use backend-developer subagent to add the query key @src/api/orders.ts
2. Use frontend-developer subagent to seed the detail page from the list
  - [Risk: shared by every order page]

**Parallel after task 2 completes:**

3. Use qa-tester subagent to verify scenarios in @src/docs/orders.feature

## Notes

1. Not a task
`

describe('parseStoryDispatches', () => {
  test('reads the story path from the expanded command', () => {
    expect(parseStoryDispatches('Execute tasks according to @src/docs/orders-story.md using subagents.')).toEqual([
      'src/docs/orders-story.md',
    ])
  })

  test("lists every story path, a skill's placeholder examples included", () => {
    expect(parseStoryDispatches('Implement story @a/b.md\n- Implement story according to @path/to/story.md')).toEqual([
      'a/b.md',
      'path/to/story.md',
    ])
  })

  test('ignores prompts without a story', () => {
    expect(parseStoryDispatches('Implement the following plan')).toEqual([])
  })
})

describe('parseTaskNumber', () => {
  test('reads the leading task number', () => {
    expect(parseTaskNumber('Task 12: Use backend-developer subagent to ...')).toBe(12)
  })

  test('ignores prompts without the prefix', () => {
    expect(parseTaskNumber('Execute BDD scenario TGC-01 in @a.feature')).toBeUndefined()
  })
})

describe('describeTask', () => {
  test('drops the task prefix a dispatch description carries', () => {
    expect(describeTask('Task 2: widen list-cache lookup')).toBe('widen list-cache lookup')
  })

  test('shortens the agent and drops file references', () => {
    expect(describeTask('Use frontend-developer subagent to build filters @src/Filters.tsx')).toBe(
      'frontend: build filters',
    )
  })
})

describe('parseTaskGroups', () => {
  test('reads the groups and numbered tasks of the Tasks section only', () => {
    expect(parseTaskGroups(STORY)).toEqual([
      {
        heading: 'Sequential tasks 1-2, no prerequisites',
        tasks: [
          { number: 1, label: 'backend: add the query key' },
          { number: 2, label: 'frontend: seed the detail page from the list' },
        ],
      },
      {
        heading: 'Parallel after task 2 completes',
        tasks: [{ number: 3, label: 'qa: verify scenarios' }],
      },
    ])
  })

  test('numbers ungrouped bullet tasks in order', () => {
    expect(parseTaskGroups('## Tasks\n\n- Use qa-tester subagent to plan\n- Use backend-developer subagent to build\n')).toEqual([
      {
        heading: 'Tasks',
        tasks: [
          { number: 1, label: 'qa: plan' },
          { number: 2, label: 'backend: build' },
        ],
      },
    ])
  })
})

describe('parseTaskResult', () => {
  test('reads completed and failed replies', () => {
    expect([parseTaskResult('completed'), parseTaskResult('failed: lint errors'), parseTaskResult('ok')]).toEqual([
      'completed',
      'failed',
      'unknown',
    ])
  })
})

describe('parseTaskVerdict', () => {
  test('reads a reply that leads with completed or failed', () => {
    expect([parseTaskVerdict('completed'), parseTaskVerdict('failed: lint errors')]).toEqual(['completed', 'failed'])
  })

  test('passes over a turn that mentions a failure it is still fixing', () => {
    expect(parseTaskVerdict('SL-03 failed, dispatching frontend-developer to fix')).toBe('unknown')
  })
})

describe('story run', () => {
  const run = startStory('src/docs/orders-story.md', parseTaskGroups(STORY))

  test('settles a background task by its agent and finishes when every task settles', () => {
    const dispatched = assignTaskAgent(markTaskRunning(run, 1, 'add the query key'), 1, 'agent-1')
    const task = findTaskByAgent(dispatched, 'agent-1')
    const done = [2, 3].reduce(
      (current, number) => recordTaskResult(markTaskRunning(current, number, ''), number, 'completed'),
      recordTaskResult(dispatched, task?.number ?? 0, 'failed'),
    )

    expect([task?.number, describeProgress(countTasks(done)), done.isDone]).toEqual([1, 'implement-story ✓2/3 ✗1', true])
  })

  test('the progress shows the running tasks and how many completed', () => {
    const running = [2, 3].reduce((current, number) => markTaskRunning(current, number, ''), recordTaskResult(markTaskRunning(run, 1, ''), 1, 'completed'))

    expect(describeProgress(countTasks(running))).toBe('implement-story ▶ Task 2,3 ✓1/3')
  })

  test('lists a dispatched task the story does not name', () => {
    expect(markTaskRunning(run, 9, 'extra work').groups.at(-1)).toEqual({
      heading: 'Not in the story',
      tasks: [{ number: 9, label: 'extra work', status: 'running' }],
    })
  })

  test('titles the story by its markdown file name, or plainly without one', () => {
    expect([storyTitle('src/docs/orders-story.md'), storyTitle('')]).toEqual(['Story: orders-story.md', 'Story'])
  })

  test('takes its owner from the loop of its first dispatch only', () => {
    const claimed = claimStoryOwner(run, 'qa-agent')
    const started = markTaskRunning(claimed, 1, '')

    expect([claimed.ownerAgentId, claimStoryOwner(started, 'other').ownerAgentId]).toEqual(['qa-agent', 'qa-agent'])
  })

  test('a later verdict replaces an unknown result', () => {
    const unknown = recordTaskResult(markTaskRunning(run, 3, ''), 3, 'unknown')
    const replaced = recordTaskResult(unknown, 3, 'completed')

    expect(replaced.groups.at(-1)?.tasks.at(-1)?.status).toBe('completed')
  })
})
