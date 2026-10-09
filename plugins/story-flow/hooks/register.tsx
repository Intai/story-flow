import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ToolCallResult } from 'claude-code'

import type { StoryRun, StoryTaskStatus } from '../types'
import {
  isMultiScenarioRun,
  parseFeatureScenarios,
  parseRequestedIds,
  parseScenarioDispatch,
  parseScenarioDispatches,
  parseScenarioResult,
} from './scenario-run/parse'
import type { ScenarioResult } from './scenario-run/parse'
import {
  assignAgent,
  canResume,
  claimOwner,
  countResults,
  describeCounts,
  describeScenarioStatus,
  findByAgent,
  hasRunning,
  hasStarted,
  markRunning,
  recordResult,
  resumeRun,
  skipPending,
  startRun,
} from './scenario-run/run'
import {
  describeTask,
  parseStoryDispatches,
  parseTaskGroups,
  parseTaskNumber,
  parseTaskResult,
  parseTaskVerdict,
} from './story-pane/parse'
import type { TaskResult } from './story-pane/parse'
import {
  assignTaskAgent,
  claimStoryOwner,
  countTasks,
  describeProgress,
  finishStory,
  findTaskByAgent,
  hasRunningTask,
  hasStartedTask,
  markTaskRunning,
  recordTaskResult,
  startStory,
  storyTitle,
} from './story-pane/run'

// The engine follows `$` only into functions declared in this file, so every function that calls
// `$` lives here; the parsing and run state of each feature are pure modules beside it.

type AgentDispatch = { prompt: string; description: string; agentId?: string }
type AgentRan = ToolCallResult<'Agent'>
type SubagentTurn = { agentId?: string; answer: string }

const STORY_PANE = 'implement-progress'
const scenarioRun = atom({ plugin: 'story-flow', key: 'scenarioRun' } as const, null)
const storyRun = atom({ plugin: 'story-flow', key: 'storyRun' } as const, null)

// Colors are Claude Code theme keys, so the marks follow the person's theme.
const TASK_MARKS: Record<StoryTaskStatus, { mark: string; color?: string }> = {
  waiting: { mark: '·' },
  running: { mark: '▶', color: 'suggestion' },
  completed: { mark: '✓', color: 'success' },
  failed: { mark: '✗', color: 'error' },
  unknown: { mark: '?', color: 'warning' },
}

async function readProjectFile($: EngineInterface, path: string): Promise<string> {
  try {
    const cwd = await $.session.cwd()

    return await $.fs.read(path.startsWith('/') ? path : `${cwd}/${path}`)
  } catch {
    return ''
  }
}

// Report text of a subagent that finished in the foreground; undefined while it runs in the background.
function foregroundReport(ran: AgentRan): string | undefined {
  const record: unknown = ran.result
  const isCompleted =
    typeof record === 'object' && record !== null && 'status' in record && record.status === 'completed'

  return isCompleted ? (ran.text ?? '') : undefined
}

function backgroundAgentId(ran: AgentRan): string | undefined {
  const record: unknown = ran.result
  const agentId =
    typeof record === 'object' && record !== null && 'agentId' in record ? record.agentId : undefined

  return typeof agentId === 'string' && foregroundReport(ran) === undefined ? agentId : undefined
}

// ---- Scenario run: execute-scenario progress in the status line ----

async function settleScenario($: EngineInterface, id: string, result: ScenarioResult) {
  const settled = await update($, scenarioRun, current =>
    current === null ? null : recordResult(current, id, result),
  )

  if (result === 'failed') $.ui.toast(`✗ ${id} failed`)
  if (settled?.isDone) $.ui.toast(`Scenarios done: ${describeCounts(countResults(settled))}`)
  await refreshStatus($)
}

// Starts from the first feature file the prompt names that holds scenarios, passing over a skill's
// placeholder examples.
async function startScenarioRunFromPrompt($: EngineInterface, text: string) {
  for (const dispatch of parseScenarioDispatches(text).filter(one => isMultiScenarioRun(one.ids))) {
    const headings = parseFeatureScenarios(await readProjectFile($, dispatch.featurePath))

    if (headings.length > 0) {
      const requested = parseRequestedIds(dispatch.ids, headings)
      await update($, scenarioRun, () => startRun(dispatch.featurePath, requested, headings))
      await refreshStatus($)
      return
    }
  }
}

async function dispatchScenario($: EngineInterface, e: AgentDispatch): Promise<string | undefined> {
  const dispatch = parseScenarioDispatch(e.prompt)

  if (dispatch === undefined) return undefined

  const current = await read($, scenarioRun)

  if (current !== null && canResume(current, dispatch.featurePath)) {
    await update($, scenarioRun, active => (active === null ? null : resumeRun(active)))
  } else if (current === null || current.isDone) {
    const headings = parseFeatureScenarios(await readProjectFile($, dispatch.featurePath))
    await update($, scenarioRun, () => startRun(dispatch.featurePath, 'all', headings, e.agentId))
  }

  await update($, scenarioRun, active =>
    active === null ? null : markRunning(claimOwner(active, e.agentId), dispatch.ids),
  )
  await refreshStatus($)

  return dispatch.ids
}

async function finishScenarioDispatch($: EngineInterface, id: string, ran: AgentRan) {
  const report = foregroundReport(ran)
  const agentId = backgroundAgentId(ran)

  if (ran.deny !== undefined || ran.isError === true) {
    await settleScenario($, id, 'unknown')
  } else if (report !== undefined) {
    await settleScenario($, id, parseScenarioResult(report))
  } else if (agentId !== undefined) {
    await update($, scenarioRun, active => (active === null ? null : assignAgent(active, id, agentId)))
  }
}

async function settleScenarioByAgent($: EngineInterface, agentId: string, report: string) {
  const current = await read($, scenarioRun)
  const scenario = current === null ? undefined : findByAgent(current, agentId)

  if (scenario !== undefined) await settleScenario($, scenario.id, parseScenarioResult(report))
}

async function closeScenarioTurn($: EngineInterface, e: SubagentTurn) {
  const current = await read($, scenarioRun)

  if (current === null || current.isDone) return

  const scenario = e.agentId === undefined ? undefined : findByAgent(current, e.agentId)

  // A subagent ends a turn each time it waits on agents of its own; only a verdict settles it.
  if (scenario !== undefined) {
    const result = parseScenarioResult(e.answer)
    if (result !== 'unknown') await settleScenario($, scenario.id, result)
  } else if (e.agentId === current.ownerAgentId && hasStarted(current) && !hasRunning(current)) {
    const settled = await update($, scenarioRun, active => (active === null ? null : skipPending(active)))
    if (settled?.isDone) $.ui.toast(`Scenarios done: ${describeCounts(countResults(settled))}`)
    await refreshStatus($)
  }
}

// ---- Story pane: implement-story task progress beside the transcript ----

async function isStoryPaneShown($: EngineInterface): Promise<boolean> {
  const panes = await $.ui.panes()

  return panes.some(pane => pane.id === STORY_PANE && pane.isPlaced && pane.isShown)
}

// A plugin has one status line, so both runs share it: the story only while its pane is out of
// sight, the scenarios while they run.
async function refreshStatus($: EngineInterface) {
  const story = await read($, storyRun)
  const scenarios = await read($, scenarioRun)
  const isStoryHidden = story !== null && !story.isDone && !(await isStoryPaneShown($))
  const parts = [
    isStoryHidden ? describeProgress(countTasks(story)) : undefined,
    scenarios === null ? undefined : describeScenarioStatus(scenarios),
  ].filter(part => part !== undefined)

  $.ui.status(parts.length > 0 ? parts.join(' · ') : undefined)
}

async function openStoryPane($: EngineInterface, run: StoryRun) {
  await $.ui.open({ id: STORY_PANE, title: storyTitle(run.storyPath) })
  await refreshStatus($)
}

async function showStoryProgress($: EngineInterface, run: StoryRun) {
  await refreshStatus($)

  if (run.isDone) $.ui.toast(`Story done: ${describeProgress(countTasks(run))}`)
}

async function settleTask($: EngineInterface, number: number, result: TaskResult) {
  const settled = await update($, storyRun, current =>
    current === null ? null : recordTaskResult(current, number, result),
  )

  if (result === 'failed') $.ui.toast(`✗ Task ${number} failed`)
  if (settled !== null) await showStoryProgress($, settled)
}

// Starts from the first story the prompt names that holds tasks, passing over a skill's placeholder
// examples.
async function startStoryFromPrompt($: EngineInterface, text: string) {
  for (const storyPath of parseStoryDispatches(text)) {
    const groups = parseTaskGroups(await readProjectFile($, storyPath))

    if (groups.length > 0) {
      const started = startStory(storyPath, groups)
      await update($, storyRun, () => started)
      await openStoryPane($, started)
      return
    }
  }
}

async function dispatchTask($: EngineInterface, e: AgentDispatch): Promise<number | undefined> {
  const number = parseTaskNumber(e.prompt)

  if (number === undefined) return undefined

  const current = await read($, storyRun)

  if (current === null || current.isDone) {
    const started = startStory('', [], e.agentId)
    await update($, storyRun, () => started)
    await openStoryPane($, started)
  }

  const running = await update($, storyRun, active =>
    active === null ? null : markTaskRunning(claimStoryOwner(active, e.agentId), number, describeTask(e.description)),
  )
  if (running !== null) await showStoryProgress($, running)

  return number
}

async function finishTaskDispatch($: EngineInterface, number: number, ran: AgentRan) {
  const report = foregroundReport(ran)
  const agentId = backgroundAgentId(ran)

  if (ran.deny !== undefined || ran.isError === true) {
    await settleTask($, number, 'failed')
  } else if (report !== undefined) {
    await settleTask($, number, parseTaskResult(report))
  } else if (agentId !== undefined) {
    await update($, storyRun, active => (active === null ? null : assignTaskAgent(active, number, agentId)))
  }
}

async function settleTaskByAgent($: EngineInterface, agentId: string, report: string) {
  const current = await read($, storyRun)
  const task = current === null ? undefined : findTaskByAgent(current, agentId)

  if (task !== undefined) await settleTask($, task.number, parseTaskResult(report))
}

async function closeStoryTurn($: EngineInterface, e: SubagentTurn) {
  const current = await read($, storyRun)

  if (current === null || current.isDone) return

  const task = e.agentId === undefined ? undefined : findTaskByAgent(current, e.agentId)

  // A subagent ends a turn each time it waits on agents of its own; only a verdict settles it.
  if (task !== undefined) {
    const result = parseTaskVerdict(e.answer)
    if (result !== 'unknown') await settleTask($, task.number, result)
  } else if (e.agentId === current.ownerAgentId && hasStartedTask(current) && !hasRunningTask(current)) {
    const finished = await update($, storyRun, active => (active === null ? null : finishStory(active)))
    if (finished !== null) await showStoryProgress($, finished)
  }
}

// ---- Registration: one hook per event, each feature observing in turn ----

async function closeStoryPane($: EngineInterface) {
  const panes = await $.ui.panes()

  if (panes.some(pane => pane.id === STORY_PANE)) await $.ui.close({ id: STORY_PANE })
}

export const register: Register = on => {
  // A pane outlives what it drew from (a reload, a resume): close it when no story is left to show.
  on('session.start', async ($, e, next) => {
    if ((await read($, storyRun)) === null) await closeStoryPane($)

    return next(e)
  })

  // A /clear starts a new conversation, so the runs of the old one are over.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, scenarioRun, () => null)
      await update($, storyRun, () => null)
      $.ui.status(undefined)
      await closeStoryPane($)
    }

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await startScenarioRunFromPrompt($, e.text)
    await startStoryFromPrompt($, e.text)

    return next(e)
  })

  // A slash command never passes through prompt.submit: its arguments reach the model in the
  // skill's expanded prompt, as they do when the model loads the skill itself.
  on('skill.prompt', async ($, e, next) => {
    await startScenarioRunFromPrompt($, e.text)
    await startStoryFromPrompt($, e.text)

    return next(e)
  })

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const scenarioId = await dispatchScenario($, e)
    const taskNumber = await dispatchTask($, e)
    const ran = await next(e)

    if (scenarioId !== undefined) await finishScenarioDispatch($, scenarioId, ran)
    if (taskNumber !== undefined) await finishTaskDispatch($, taskNumber, ran)

    return ran
  })

  // A background subagent reports through its own hand-back tool call, not its final answer.
  on('tool.call', async ($, e, next) => {
    if (String(e.tool) === 'SubagentHandback' && e.agentId !== undefined) {
      const report = JSON.stringify(e)
      await settleScenarioByAgent($, e.agentId, report)
      await settleTaskByAgent($, e.agentId, report)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await closeScenarioTurn($, e)
    await closeStoryTurn($, e)

    return next(e)
  })

  on('ui.close', { id: STORY_PANE }, async ($, e, next) => {
    const closed = await next(e)
    await refreshStatus($)

    return closed
  })

  on('ui.render', { component: 'Pane', requestId: STORY_PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const current = await read($, storyRun)

    if (current === null) {
      return <Text> </Text>
    }

    const { total, completed } = countTasks(current)

    return (
      <Box flexDirection="column">
        <Text wrap="truncate-end">
          <Text bold>{storyTitle(current.storyPath)}</Text> · <Text color={TASK_MARKS.completed.color}>✓</Text>
          {completed}/{total}
          {current.isDone ? ' · done' : ''}
        </Text>
        {current.groups.map(group => (
          <Box flexDirection="column">
            <Text dimColor wrap="truncate-end">
              {group.heading}
            </Text>
            {group.tasks.map(task => {
              const { mark, color } = TASK_MARKS[task.status]

              return (
                <Text wrap="truncate-end" dimColor={task.status === 'waiting'}>
                  {'  '}
                  <Text color={color}>{mark}</Text> {task.number} {task.label}
                </Text>
              )
            })}
          </Box>
        ))}
      </Box>
    )
  })
}
