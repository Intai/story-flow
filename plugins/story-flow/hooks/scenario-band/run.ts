import type { Scenario, ScenarioRun } from '../../types'
import type { ScenarioHeading, ScenarioResult } from './parse'

export type RunCounts = { passed: number; failed: number; unknown: number; skipped: number }

export function startRun(
  featurePath: string,
  requested: 'all' | string[],
  headings: ScenarioHeading[],
): ScenarioRun {
  const chosen =
    requested === 'all'
      ? headings
      : requested.map(id => headings.find(one => one.id === id) ?? { id, title: '' })

  return {
    featurePath,
    scenarios: chosen.map(({ id, title }) => ({ id, title, status: 'pending' })),
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
    one.id === id && one.status === 'running' ? { ...one, status: result } : one,
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
    passed: count('passed'),
    failed: count('failed'),
    unknown: count('unknown'),
    skipped: count('skipped'),
  }
}

export function describeCounts({ passed, failed, unknown, skipped }: RunCounts): string {
  return [
    `✓${passed} ✗${failed}`,
    unknown > 0 ? `?${unknown}` : '',
    skipped > 0 ? `⊘${skipped}` : '',
  ]
    .filter(part => part !== '')
    .join(' ')
}
