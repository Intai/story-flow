import { describe, expect, test } from 'claude-code/testing'

import {
  isMultiScenarioRun,
  parseFeatureScenarios,
  parseRequestedIds,
  parseScenarioDispatch,
  parseScenarioResult,
} from './parse'
import {
  canResume,
  claimOwner,
  countResults,
  describeCounts,
  describeScenarioStatus,
  markRunning,
  recordResult,
  resumeRun,
  skipPending,
  startRun,
} from './run'

const SECOND_FEATURE = `Feature: Languages
  Scenario: SMG-01: Add a language
  Scenario: LNG-02: Remove a language
`

const FEATURE = `Feature: Strings
  @screenshots
  Scenario: SMG-01: Display available languages
    Given I am on the strings page
  Scenario Outline: SMG-02: Search and filter strings
    When I search "<term>"
  Scenario: SMG-03: Inline edit a string value
`

describe('parseScenarioDispatch', () => {
  test('reads the ids and feature path from the expanded command', () => {
    expect(
      parseScenarioDispatch('Execute BDD scenario all in @src/strings/docs/strings.feature --record.'),
    ).toEqual({ ids: 'all', featurePaths: ['src/strings/docs/strings.feature'] })
  })

  test('reads one scenario id from a subagent prompt', () => {
    expect(
      parseScenarioDispatch('Execute BDD scenario SMG-02 in @a/b.feature [--record if recording mode is active].'),
    ).toEqual({ ids: 'SMG-02', featurePaths: ['a/b.feature'] })
  })

  test('reads the ids and feature path from the command arguments as typed', () => {
    expect(parseScenarioDispatch('Execute BDD scenario TGC-02,TGC-03 @src/a.feature --record.')).toEqual({
      ids: 'TGC-02,TGC-03',
      featurePaths: ['src/a.feature'],
    })
  })

  test('reads all from the command arguments as typed', () => {
    const dispatch = parseScenarioDispatch('Execute BDD scenario all @src/a.feature.')

    expect([dispatch, isMultiScenarioRun(dispatch?.ids ?? '')]).toEqual([
      { ids: 'all', featurePaths: ['src/a.feature'] },
      true,
    ])
  })

  test('reads every feature path the command arguments name', () => {
    expect(parseScenarioDispatch('Execute BDD scenario all @docs/a.feature @docs/b.feature --record.')).toEqual({
      ids: 'all',
      featurePaths: ['docs/a.feature', 'docs/b.feature'],
    })
  })

  test('ignores unrelated prompts', () => {
    expect(parseScenarioDispatch('Implement the login form')).toBeUndefined()
  })
})

describe('isMultiScenarioRun', () => {
  test('treats all, comma lists and ranges as multi-scenario runs', () => {
    expect([
      isMultiScenarioRun('all'),
      isMultiScenarioRun('A-01,A-02'),
      isMultiScenarioRun('A-01..A-03'),
      isMultiScenarioRun('A-01'),
    ]).toEqual([true, true, true, false])
  })
})

describe('parseRequestedIds', () => {
  test('splits a comma list of ids', () => {
    expect(parseRequestedIds('A-01,A-02', [])).toEqual(['A-01', 'A-02'])
  })

  test('expands a range to the feature headings between its ends', () => {
    expect(parseRequestedIds('SMG-01..SMG-03', parseFeatureScenarios(FEATURE))).toEqual([
      'SMG-01',
      'SMG-02',
      'SMG-03',
    ])
  })

  test('expands ranges within a comma list', () => {
    expect(parseRequestedIds('SMG-01..SMG-02,SMG-03', parseFeatureScenarios(FEATURE))).toEqual([
      'SMG-01',
      'SMG-02',
      'SMG-03',
    ])
  })

  test('keeps the ends of a range the feature does not hold', () => {
    expect(parseRequestedIds('SMG-01..SMG-09', parseFeatureScenarios(FEATURE))).toEqual(['SMG-01', 'SMG-09'])
  })
})

describe('parseFeatureScenarios', () => {
  test('reads scenario and outline headings in order', () => {
    expect(parseFeatureScenarios(FEATURE)).toEqual([
      { id: 'SMG-01', title: 'Display available languages' },
      { id: 'SMG-02', title: 'Search and filter strings' },
      { id: 'SMG-03', title: 'Inline edit a string value' },
    ])
  })
})

describe('parseScenarioResult', () => {
  test('prefers the last RESULT line', () => {
    expect(parseScenarioResult('Step ✓ passed\nRESULT: FAILED')).toBe('failed')
  })

  test('falls back to failure marks', () => {
    expect(parseScenarioResult('SMG-02 ✗ FAILED at line 12')).toBe('failed')
  })

  test('falls back to pass marks', () => {
    expect(parseScenarioResult('SMG-01 ✓ PASSED')).toBe('passed')
  })

  test('reads the unit-test verdicts of an integration scenario', () => {
    expect([
      parseScenarioResult('Covered by tests/test_settle.py\nRESULT: UNIT TESTED'),
      parseScenarioResult('Gap at line 12 ✗\nRESULT: UNIT TEST GAP'),
    ]).toEqual(['unit-tested', 'unit-test-gap'])
  })

  test('answers unknown without a verdict', () => {
    expect(parseScenarioResult('Done.')).toBe('unknown')
  })
})

describe('run', () => {
  const run = startRun([{ featurePath: 'a.feature', requested: 'all', headings: parseFeatureScenarios(FEATURE) }])

  test('a failure skips the scenarios not yet run and finishes the run', () => {
    const failed = recordResult(markRunning(recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'passed'), 'a.feature', 'SMG-02'), 'a.feature', 'SMG-02', 'failed')

    expect(failed.scenarios.map(one => one.status)).toEqual(['passed', 'failed', 'skipped'])
    expect(failed.isDone).toBe(true)
  })

  test('a unit test gap keeps the run going', () => {
    const gap = recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'unit-test-gap')

    expect(gap.scenarios.map(one => one.status)).toEqual(['unit-test-gap', 'pending', 'pending'])
    expect(gap.isDone).toBe(false)
  })

  test('counts describe unit-tested scenarios and unit test gaps', () => {
    const tested = recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'unit-tested')
    const gap = recordResult(markRunning(tested, 'a.feature', 'SMG-02'), 'a.feature', 'SMG-02', 'unit-test-gap')

    expect(describeCounts(countResults(gap))).toBe('✓0/3 ✗0 ↳1 ⚠1')
  })

  test('a retry keeps the unit-tested scenarios and runs a unit test gap again', () => {
    const tested = recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'unit-tested')
    const closed = skipPending(recordResult(markRunning(tested, 'a.feature', 'SMG-02'), 'a.feature', 'SMG-02', 'unit-test-gap'))

    expect(resumeRun(closed).scenarios.map(one => one.status)).toEqual(['unit-tested', 'pending', 'pending'])
  })

  test('requested ids keep only those scenarios', () => {
    expect(startRun([{ featurePath: 'a.feature', requested: ['SMG-03'], headings: parseFeatureScenarios(FEATURE) }]).scenarios).toEqual([
      { featurePath: 'a.feature', id: 'SMG-03', title: 'Inline edit a string value', status: 'pending' },
    ])
  })

  test('counts describe passes, failures and skips', () => {
    expect(describeCounts(countResults(skipPending(recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'passed'))))).toBe(
      '✓1/3 ✗0 ⊘2',
    )
  })

  test('takes its owner from the loop of its first dispatch only', () => {
    const claimed = claimOwner(run, 'qa-agent')
    const started = markRunning(claimed, 'a.feature', 'SMG-01')

    expect([claimed.ownerAgentId, claimOwner(started, 'other').ownerAgentId]).toEqual(['qa-agent', 'qa-agent'])
  })

  test('the status shows the running scenario and how many passed, and nothing once done', () => {
    const passed = recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'passed')

    expect([
      describeScenarioStatus(markRunning(passed, 'a.feature', 'SMG-02')),
      describeScenarioStatus(passed),
      describeScenarioStatus(skipPending(passed)),
    ]).toEqual(['execute-scenario ▶ SMG-02 ✓1/3 ✗0', 'execute-scenario ✓1/3 ✗0', undefined])
  })

  test('a retry after a failure keeps the passes and runs the failed and skipped scenarios again', () => {
    const failed = recordResult(markRunning(recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'passed'), 'a.feature', 'SMG-02'), 'a.feature', 'SMG-02', 'failed')
    const resumed = resumeRun(failed)

    expect(resumed.scenarios.map(one => one.status)).toEqual(['passed', 'pending', 'pending'])
    expect(resumed.isDone).toBe(false)
  })

  test('only a run on the same feature with scenarios left to pass can resume', () => {
    const failed = recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'failed')
    const allPassed = ['SMG-01', 'SMG-02', 'SMG-03'].reduce(
      (current, id) => recordResult(markRunning(current, 'a.feature', id), 'a.feature', id, 'passed'),
      run,
    )

    expect([canResume(failed, 'a.feature'), canResume(failed, 'b.feature'), canResume(allPassed, 'a.feature')]).toEqual([
      true,
      false,
      false,
    ])
  })

  test('a dispatch after the run closed early keeps the passes', () => {
    const closed = skipPending(recordResult(markRunning(run, 'a.feature', 'SMG-01'), 'a.feature', 'SMG-01', 'passed'))
    const resumed = markRunning(resumeRun(closed), 'a.feature', 'SMG-02')

    expect(canResume(closed, 'a.feature')).toBe(true)
    expect(describeScenarioStatus(resumed)).toBe('execute-scenario ▶ SMG-02 ✓1/3 ✗0')
  })
})

describe('run over several feature files', () => {
  const features = [
    { featurePath: 'docs/a.feature', requested: 'all' as const, headings: parseFeatureScenarios(FEATURE) },
    { featurePath: 'docs/b.feature', requested: 'all' as const, headings: parseFeatureScenarios(SECOND_FEATURE) },
  ]
  const run = startRun(features)

  test('counts the scenarios of every file in the order the files were named', () => {
    expect(run.scenarios.map(one => `${one.featurePath}:${one.id}`)).toEqual([
      'docs/a.feature:SMG-01',
      'docs/a.feature:SMG-02',
      'docs/a.feature:SMG-03',
      'docs/b.feature:SMG-01',
      'docs/b.feature:LNG-02',
    ])
  })

  test('settles the scenario of the file its dispatch names when two files share an id', () => {
    const passed = recordResult(markRunning(run, 'docs/b.feature', 'SMG-01'), 'docs/b.feature', 'SMG-01', 'passed')

    expect(passed.scenarios.map(one => one.status)).toEqual(['pending', 'pending', 'pending', 'passed', 'pending'])
  })

  test('matches a dispatch that names the file from another folder', () => {
    const running = markRunning(run, 'src/docs/b.feature', 'LNG-02')

    expect([running.scenarios.length, describeScenarioStatus(running)]).toEqual([5, 'execute-scenario ▶ LNG-02 ✓0/5 ✗0'])
  })

  test('requested ids run from the file that holds them', () => {
    const chosen = startRun(features.map(one => ({ ...one, requested: ['SMG-03', 'LNG-02'] })))

    expect(chosen.scenarios.map(one => `${one.featurePath}:${one.id}`)).toEqual([
      'docs/a.feature:SMG-03',
      'docs/b.feature:LNG-02',
    ])
  })

  test('a run closed early resumes from a dispatch on any of its files', () => {
    const closed = skipPending(recordResult(markRunning(run, 'docs/a.feature', 'SMG-01'), 'docs/a.feature', 'SMG-01', 'passed'))

    expect([canResume(closed, 'docs/a.feature'), canResume(closed, 'docs/b.feature'), canResume(closed, 'docs/c.feature')]).toEqual([
      true,
      true,
      false,
    ])
  })
})
