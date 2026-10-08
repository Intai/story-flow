import type { Scenario, ScenarioRun } from '../../types'
import type { ScenarioHeading, ScenarioResult } from './parse'

export type RunCounts = { total: number; passed: number; failed: number; unknown: number; skipped: number }

export function startRun(
  featurePath: string,
  requested: 'all' | string[],
  headings: ScenarioHeading[],
  ownerAgentId?: string,
): ScenarioRun {
  const chosen =
    requested === 'all'
      ? headings
      : requested.map(id => headings.find(one => one.id === id) ?? { id, title: '' })

  return {
    featurePath,
    scenarios: chosen.map(({ id, title }) => ({ id, title, status: 'pending' })),
    ownerAgentId,
    isDone: false,
  }
}

export function markRunning(run: ScenarioRun, id: string): ScenarioRun {
  const isKnown = run.scenarios.some(one => one.id === id)
  const scenarios: Scenario[] = isKnown
    ? run.scenarios
    : [...run.scenarios, { id, title: '', status: 'pending' }]

  return {
    ...run,
    scenarios: scenarios.map(one => (one.id === id ? { ...one, status: 'running' } : one)),
  }
}

export function assignAgent(run: ScenarioRun, id: string, agentId: string): ScenarioRun {
  return {
    ...run,
    scenarios: run.scenarios.map(one => (one.id === id ? { ...one, agentId } : one)),
  }
}

export function findByAgent(run: ScenarioRun, agentId: string): Scenario | undefined {
  return run.scenarios.find(one => one.agentId === agentId)
}

export function recordResult(run: ScenarioRun, id: string, result: ScenarioResult): ScenarioRun {
  const scenarios = run.scenarios.map(one =>
    one.id === id && (one.status === 'running' || one.status === 'unknown') ? { ...one, status: result } : one,
  )
  const recorded = { ...run, scenarios }

  return result === 'failed' ? skipPending(recorded) : finishWhenSettled(recorded)
}

export function skipPending(run: ScenarioRun): ScenarioRun {
  const scenarios = run.scenarios.map(one =>
    one.status === 'pending' ? { ...one, status: 'skipped' as const } : one,
  )

  return finishWhenSettled({ ...run, scenarios })
}

// A retry after a fix dispatches the failed scenario again; the run it ended picks up from there.
export function canResume(run: ScenarioRun, featurePath: string): boolean {
  return run.isDone && run.featurePath === featurePath && run.scenarios.some(one => one.status === 'failed')
}

export function resumeRun(run: ScenarioRun): ScenarioRun {
  const scenarios = run.scenarios.map(one =>
    one.status === 'passed' ? one : { ...one, status: 'pending' as const },
  )

  return { ...run, scenarios, isDone: false }
}

// A run started from a skill's prompt does not know which loop runs it; its first dispatch does.
export function claimOwner(run: ScenarioRun, agentId: string | undefined): ScenarioRun {
  return hasStarted(run) ? run : { ...run, ownerAgentId: agentId }
}

export function hasStarted(run: ScenarioRun): boolean {
  return run.scenarios.some(one => one.status !== 'pending')
}

export function hasRunning(run: ScenarioRun): boolean {
  return run.scenarios.some(one => one.status === 'running')
}

export function finishWhenSettled(run: ScenarioRun): ScenarioRun {
  const isSettled = run.scenarios.every(one => one.status !== 'pending' && one.status !== 'running')

  return { ...run, isDone: isSettled }
}

export function countResults(run: ScenarioRun): RunCounts {
  const count = (status: Scenario['status']) =>
    run.scenarios.filter(one => one.status === status).length

  return {
    total: run.scenarios.length,
    passed: count('passed'),
    failed: count('failed'),
    unknown: count('unknown'),
    skipped: count('skipped'),
  }
}

// The scenario part of the plugin's status line while a run is going; none once it is done.
export function describeScenarioStatus(run: ScenarioRun): string | undefined {
  if (run.isDone) return undefined

  const running = run.scenarios.find(one => one.status === 'running')
  const position = running ? `▶ ${running.id} ` : ''

  return `execute-scenario ${position}${describeCounts(countResults(run))}`
}

export function describeCounts({ total, passed, failed, unknown, skipped }: RunCounts): string {
  return [
    `✓${passed}/${total} ✗${failed}`,
    unknown > 0 ? `?${unknown}` : '',
    skipped > 0 ? `⊘${skipped}` : '',
  ]
    .filter(part => part !== '')
    .join(' ')
}
