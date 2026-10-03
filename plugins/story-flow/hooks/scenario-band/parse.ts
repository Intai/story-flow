export type ScenarioDispatch = { ids: string; featurePath: string }
export type ScenarioHeading = { id: string; title: string }
export type ScenarioResult = 'passed' | 'failed' | 'unknown'

const DISPATCH = /Execute BDD scenario (\S+) in @?(\S+?\.feature)\b/
const HEADING = /^\s*Scenario(?: Outline)?:\s*([A-Za-z][\w]*-\d+):\s*(.+?)\s*$/gm
const RESULT_LINE = /RESULT:\s*(PASSED|FAILED)/gi

export function parseScenarioDispatch(text: string): ScenarioDispatch | undefined {
  const match = DISPATCH.exec(text)
  const [, ids, featurePath] = match ?? []

  return ids && featurePath ? { ids, featurePath } : undefined
}

export function isMultiScenarioRun(ids: string): boolean {
  return ids === 'all' || ids.includes(',')
}

export function parseRequestedIds(ids: string): 'all' | string[] {
  return ids === 'all' ? 'all' : ids.split(',').filter(id => id !== '')
}

export function parseFeatureScenarios(text: string): ScenarioHeading[] {
  return [...text.matchAll(HEADING)].map(([, id = '', title = '']) => ({ id, title }))
}

export function parseScenarioResult(text: string): ScenarioResult {
  const verdicts = [...text.matchAll(RESULT_LINE)]
  const lastVerdict = verdicts.at(-1)?.[1]?.toUpperCase()

  if (lastVerdict === 'PASSED') return 'passed'
  if (lastVerdict === 'FAILED') return 'failed'
  if (/✗|\bFAILED\b/.test(text)) return 'failed'
  if (/✓|\bPASSED\b/.test(text)) return 'passed'

  return 'unknown'
}
