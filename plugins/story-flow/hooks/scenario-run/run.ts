import type { Scenario, ScenarioRun } from '../../types'
import type { ScenarioHeading, ScenarioResult } from './parse'

export type RunCounts = {
  total: number
  passed: number
  failed: number
  unitTested: number
  unitTestGap: number
  unknown: number
  skipped: number
}

// A scenario covered by unit tests needs no rerun, as one that passed; a gap does once tests fill it.
function isSettledForGood(one: Scenario): boolean {
  return one.status === 'passed' || one.status === 'unit-tested'
}

export type FeatureRequest = {
  featurePath: string
  requested: 'all' | string[]
  headings: ScenarioHeading[]
}

// The scenarios of every feature file, in the order the files were named. A requested id runs from
// the file that holds it; one no file holds stays with the first file, untitled.
export function startRun(features: FeatureRequest[], ownerAgentId?: string): ScenarioRun {
  const heldIds = new Set(features.flatMap(({ headings }) => headings.map(one => one.id)))
  const scenarios = features.flatMap(({ featurePath, requested, headings }, index) =>
    chooseScenarios(requested, headings, heldIds, index === 0).map(({ id, title }) => ({
      featurePath,
      id,
      title,
      status: 'pending' as const,
    })),
  )

  return {
    featurePaths: features.map(one => one.featurePath),
    scenarios,
    ownerAgentId,
    isDone: false,
  }
}

function chooseScenarios(
  requested: 'all' | string[],
  headings: ScenarioHeading[],
  heldIds: Set<string>,
  isFirstFeature: boolean,
): ScenarioHeading[] {
  if (requested === 'all') return headings

  return requested.flatMap(id => {
    const heading = headings.find(one => one.id === id)

    if (heading !== undefined) return [heading]

    return isFirstFeature && !heldIds.has(id) ? [{ id, title: '' }] : []
  })
}

// A subagent's prompt may name the file from another folder than the command did.
export function isSameFeature(one: string, other: string): boolean {
  return one === other || one.endsWith(`/${other}`) || other.endsWith(`/${one}`)
}

function isScenario(one: Scenario, featurePath: string, id: string): boolean {
  return one.id === id && isSameFeature(one.featurePath, featurePath)
}

function namesFeature(run: ScenarioRun, featurePath: string): boolean {
  return run.featurePaths.some(one => isSameFeature(one, featurePath))
}

export function markRunning(run: ScenarioRun, featurePath: string, id: string): ScenarioRun {
  const isKnown = run.scenarios.some(one => isScenario(one, featurePath, id))
  const scenarios: Scenario[] = isKnown
    ? run.scenarios
    : [...run.scenarios, { featurePath, id, title: '', status: 'pending' }]
  const featurePaths = namesFeature(run, featurePath) ? run.featurePaths : [...run.featurePaths, featurePath]

  return {
    ...run,
    featurePaths,
    scenarios: scenarios.map(one => (isScenario(one, featurePath, id) ? { ...one, status: 'running' } : one)),
  }
}

export function assignAgent(run: ScenarioRun, featurePath: string, id: string, agentId: string): ScenarioRun {
  return {
    ...run,
    scenarios: run.scenarios.map(one => (isScenario(one, featurePath, id) ? { ...one, agentId } : one)),
  }
}

export function findByAgent(run: ScenarioRun, agentId: string): Scenario | undefined {
  return run.scenarios.find(one => one.agentId === agentId)
}

export function recordResult(
  run: ScenarioRun,
  featurePath: string,
  id: string,
  result: ScenarioResult,
): ScenarioRun {
  const scenarios = run.scenarios.map(one =>
    isScenario(one, featurePath, id) && (one.status === 'running' || one.status === 'unknown') ? { ...one, status: result } : one,
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

// A dispatch after the run closed with scenarios left to pass, a retry after a fix or the next of
// one-at-a-time dispatches, picks the run up from there.
export function canResume(run: ScenarioRun, featurePath: string): boolean {
  return run.isDone && namesFeature(run, featurePath) && !run.scenarios.every(isSettledForGood)
}

export function resumeRun(run: ScenarioRun): ScenarioRun {
  const scenarios = run.scenarios.map(one =>
    isSettledForGood(one) ? one : { ...one, status: 'pending' as const },
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
    unitTested: count('unit-tested'),
    unitTestGap: count('unit-test-gap'),
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

export function describeCounts({ total, passed, failed, unitTested, unitTestGap, unknown, skipped }: RunCounts): string {
  return [
    `✓${passed}/${total} ✗${failed}`,
    unitTested > 0 ? `↳${unitTested}` : '',
    unitTestGap > 0 ? `⚠${unitTestGap}` : '',
    unknown > 0 ? `?${unknown}` : '',
    skipped > 0 ? `⊘${skipped}` : '',
  ]
    .filter(part => part !== '')
    .join(' ')
}
