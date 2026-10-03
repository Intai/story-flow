import type { StoryRun, StoryTask, StoryTaskStatus } from '../../types'
import type { ParsedGroup, TaskResult } from './parse'

export type TaskCounts = { total: number; completed: number; failed: number; runningNumbers: number[] }

const UNLISTED_HEADING = 'Not in the story'

export function startStory(storyPath: string, groups: ParsedGroup[], ownerAgentId?: string): StoryRun {
  return {
    storyPath,
    groups: groups.map(({ heading, tasks }) => ({
      heading,
      tasks: tasks.map(({ number, label }) => ({ number, label, status: 'waiting' })),
    })),
    ownerAgentId,
    isDone: false,
  }
}

function mapTasks(run: StoryRun, change: (task: StoryTask) => StoryTask): StoryRun {
  return {
    ...run,
    groups: run.groups.map(group => ({ ...group, tasks: group.tasks.map(change) })),
  }
}

function allTasks(run: StoryRun): StoryTask[] {
  return run.groups.flatMap(group => group.tasks)
}

function addUnlistedTask(run: StoryRun, number: number, label: string): StoryRun {
  const task: StoryTask = { number, label, status: 'waiting' }
  const hasUnlisted = run.groups.some(group => group.heading === UNLISTED_HEADING)
  const groups = hasUnlisted
    ? run.groups.map(group =>
        group.heading === UNLISTED_HEADING ? { ...group, tasks: [...group.tasks, task] } : group,
      )
    : [...run.groups, { heading: UNLISTED_HEADING, tasks: [task] }]

  return { ...run, groups }
}

export function markTaskRunning(run: StoryRun, number: number, label: string): StoryRun {
  const isListed = allTasks(run).some(task => task.number === number)
  const listed = isListed ? run : addUnlistedTask(run, number, label)

  return mapTasks(listed, task => (task.number === number ? { ...task, status: 'running' } : task))
}

export function assignTaskAgent(run: StoryRun, number: number, agentId: string): StoryRun {
  return mapTasks(run, task => (task.number === number ? { ...task, agentId } : task))
}

export function findTaskByAgent(run: StoryRun, agentId: string): StoryTask | undefined {
  return allTasks(run).find(task => task.agentId === agentId)
}

// A story started from a skill's prompt does not know which loop runs it; its first dispatch does.
export function claimStoryOwner(run: StoryRun, agentId: string | undefined): StoryRun {
  return hasStartedTask(run) ? run : { ...run, ownerAgentId: agentId }
}

export function hasStartedTask(run: StoryRun): boolean {
  return allTasks(run).some(task => task.status !== 'waiting')
}

export function hasRunningTask(run: StoryRun): boolean {
  return allTasks(run).some(task => task.status === 'running')
}

export function recordTaskResult(run: StoryRun, number: number, result: TaskResult): StoryRun {
  const recorded = mapTasks(run, task =>
    task.number === number && (task.status === 'running' || task.status === 'unknown')
      ? { ...task, status: result satisfies StoryTaskStatus }
      : task,
  )
  const isSettled = allTasks(recorded).every(
    task => task.status !== 'waiting' && task.status !== 'running',
  )

  return { ...recorded, isDone: isSettled }
}

export function finishStory(run: StoryRun): StoryRun {
  return { ...run, isDone: true }
}

export function countTasks(run: StoryRun): TaskCounts {
  const tasks = allTasks(run)
  const count = (status: StoryTaskStatus) => tasks.filter(task => task.status === status).length

  return {
    total: tasks.length,
    completed: count('completed'),
    failed: count('failed'),
    runningNumbers: tasks.filter(task => task.status === 'running').map(task => task.number),
  }
}

export function describeProgress({ total, completed, failed, runningNumbers }: TaskCounts): string {
  const running = runningNumbers.length > 0 ? `▶ Task ${runningNumbers.join(',')} ` : ''
  const progress = `implement-story ${running}✓${completed}/${total}`

  return failed > 0 ? `${progress} ✗${failed}` : progress
}

export function storyTitle(storyPath: string): string {
  const fileName = storyPath.split('/').at(-1) ?? ''

  return fileName === '' ? 'Story' : `Story: ${fileName}`
}
