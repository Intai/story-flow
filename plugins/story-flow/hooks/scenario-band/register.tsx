import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { ScenarioRun } from '../../types'
import {
  isMultiScenarioRun,
  parseFeatureScenarios,
  parseRequestedIds,
  parseScenarioDispatch,
  parseScenarioResult,
} from './parse'
import type { ScenarioResult } from './parse'
import {
  assignAgent,
  countResults,
  describeCounts,
  findByAgent,
  hasRunning,
  markRunning,
  recordResult,
  skipPending,
  startRun,
} from './run'

const run = atom({ plugin: 'story-flow', key: 'scenarioRun' } as const, null)

async function readFeatureText($: EngineInterface, featurePath: string): Promise<string> {
  try {
    const cwd = await $.session.cwd()
    const absolutePath = featurePath.startsWith('/') ? featurePath : `${cwd}/${featurePath}`

    return await $.fs.read(absolutePath)
  } catch {
    return ''
  }
}

function announceSettled($: EngineInterface, settled: ScenarioRun) {
  if (settled.isDone) {
    $.ui.toast(`Scenarios done: ${describeCounts(countResults(settled))}`)
  }
}

async function settleScenario($: EngineInterface, id: string, result: ScenarioResult) {
  const settled = await update($, run, current =>
    current === null ? null : recordResult(current, id, result),
  )

  if (result === 'failed') $.ui.toast(`✗ ${id} failed`)
  if (settled !== null) announceSettled($, settled)
}

export const registerScenarioBand: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const dispatch = parseScenarioDispatch(e.text)

    if (dispatch !== undefined && isMultiScenarioRun(dispatch.ids)) {
      const headings = parseFeatureScenarios(await readFeatureText($, dispatch.featurePath))
      const requested = parseRequestedIds(dispatch.ids)
      await update($, run, () => startRun(dispatch.featurePath, requested, headings))
    }

    return next(e)
  })

  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    const dispatch = parseScenarioDispatch(e.prompt)

    if (dispatch === undefined) {
      return next(e)
    }

    const current = await read($, run)

    if (current === null || current.isDone) {
      const headings = parseFeatureScenarios(await readFeatureText($, dispatch.featurePath))
      await update($, run, () => startRun(dispatch.featurePath, 'all', headings))
    }

    await update($, run, active => (active === null ? null : markRunning(active, dispatch.ids)))
    const ran = await next(e)

    if (ran.deny !== undefined || ran.isError === true) {
      await settleScenario($, dispatch.ids, 'unknown')
      return ran
    }

    const record = ran.result

    if ('status' in record && record.status === 'completed') {
      await settleScenario($, dispatch.ids, parseScenarioResult(ran.text ?? ''))
    } else if ('agentId' in record) {
      const { agentId } = record
      await update($, run, active =>
        active === null ? null : assignAgent(active, dispatch.ids, agentId),
      )
    }

    return ran
  })

  // A background subagent reports through its own hand-back tool call, not its final answer.
  on('tool.call', async ($, e, next) => {
    const current = await read($, run)

    if (String(e.tool) !== 'SubagentHandback' || e.agentId === undefined || current === null) {
      return next(e)
    }

    const scenario = findByAgent(current, e.agentId)
    if (scenario !== undefined) {
      await settleScenario($, scenario.id, parseScenarioResult(JSON.stringify(e)))
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const current = await read($, run)

    if (current === null || current.isDone) {
      return next(e)
    }

    if (e.agentId !== undefined) {
      const scenario = findByAgent(current, e.agentId)
      if (scenario !== undefined) {
        await settleScenario($, scenario.id, parseScenarioResult(e.answer))
      }
    } else if (!hasRunning(current)) {
      const settled = await update($, run, active => (active === null ? null : skipPending(active)))
      if (settled !== null) announceSettled($, settled)
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, run)

    if (e.props.hasSurvey || current === null) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const total = current.scenarios.length
    const runningIndex = current.scenarios.findIndex(one => one.status === 'running')
    const running = current.scenarios[runningIndex]
    const counts = describeCounts(countResults(current))
    const label = current.isDone
      ? 'Scenarios done'
      : running
        ? `▶ ${running.id} ${running.title}`.trim()
        : '… waiting for next scenario'
    const position = running ? ` · ${runningIndex + 1}/${total}` : ''

    return (
      <Box>
        <Text dimColor={current.isDone}>
          {label}
          {position} · {counts}
        </Text>
      </Box>
    )
  })
}
