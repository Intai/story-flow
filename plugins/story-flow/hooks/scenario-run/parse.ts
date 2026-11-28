export type ScenarioDispatch = { ids: string; featurePaths: string[] }
export type ScenarioHeading = { id: string; title: string }
export type ScenarioResult = 'passed' | 'failed' | 'unit-tested' | 'unit-test-gap' | 'unknown'

// One feature file for a subagent's dispatch; as many as the command names for a run.
const DISPATCH = /Execute BDD scenario (\S+) (?:in )?((?:@?\S+?\.feature\b\s*)+)/
const FEATURE_PATH = /@?(\S+?\.feature)\b/g
const HEADING = /^\s*Scenario(?: Outline)?:\s*([A-Za-z][\w]*-\d+):\s*(.+?)\s*$/gm
const RESULT_LINE = /RESULT:\s*(PASSED|FAILED|UNIT TESTED|UNIT TEST GAP)/gi
const VERDICTS: Record<string, ScenarioResult> = {
  PASSED: 'passed',
  FAILED: 'failed',
  'UNIT TESTED': 'unit-tested',
  'UNIT TEST GAP': 'unit-test-gap',
}

export function parseScenarioDispatch(text: string): ScenarioDispatch | undefined {
  const [, ids, paths] = DISPATCH.exec(text) ?? []

  return ids && paths ? { ids, featurePaths: parseFeaturePaths(paths) } : undefined
}

export function parseFeaturePaths(text: string): string[] {
  return [...text.matchAll(FEATURE_PATH)].flatMap(([, path]) => (path ? [path] : []))
}

// Every dispatch a prompt names, in order: a skill's own examples name placeholder paths too.
export function parseScenarioDispatches(text: string): ScenarioDispatch[] {
  return [...text.matchAll(new RegExp(DISPATCH, 'g'))].flatMap(([, ids, paths]) =>
    ids && paths ? [{ ids, featurePaths: parseFeaturePaths(paths) }] : [],
  )
}

export function isMultiScenarioRun(ids: string): boolean {
  return ids === 'all' || ids.includes(',') || ids.includes('..')
}

export function parseRequestedIds(ids: string, headings: ScenarioHeading[]): 'all' | string[] {
  return ids === 'all'
    ? 'all'
    : ids
        .split(',')
        .filter(id => id !== '')
        .flatMap(id => expandRange(id, headings))
}

// A range spans the feature's headings from one id to the other, so ids that skip numbers still count.
export function expandRange(id: string, headings: ScenarioHeading[]): string[] {
  const [first = '', last] = id.split('..')
  const firstIndex = headings.findIndex(one => one.id === first)
  const lastIndex = headings.findIndex(one => one.id === last)

  if (last === undefined) return [id]
  if (firstIndex < 0 || lastIndex < firstIndex) return [first, last]

  return headings.slice(firstIndex, lastIndex + 1).map(one => one.id)
}

export function parseFeatureScenarios(text: string): ScenarioHeading[] {
  return [...text.matchAll(HEADING)].map(([, id = '', title = '']) => ({ id, title }))
}

export function parseScenarioResult(text: string): ScenarioResult {
  const verdicts = [...text.matchAll(RESULT_LINE)]
  const lastVerdict = verdicts.at(-1)?.[1]?.toUpperCase()

  if (lastVerdict !== undefined) return VERDICTS[lastVerdict] ?? 'unknown'
  if (/✗|\bFAILED\b/.test(text)) return 'failed'
  if (/✓|\bPASSED\b/.test(text)) return 'passed'

  return 'unknown'
}
