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
    ).toEqual({ ids: 'all', featurePath: 'src/strings/docs/strings.feature' })
  })

  test('reads one scenario id from a subagent prompt', () => {
    expect(
      parseScenarioDispatch('Execute BDD scenario SMG-02 in @a/b.feature [--record if recording mode is active].'),
    ).toEqual({ ids: 'SMG-02', featurePath: 'a/b.feature' })
  })

  test('reads the ids and feature path from the command arguments as typed', () => {
    expect(parseScenarioDispatch('Execute BDD scenario TGC-02,TGC-03 @src/a.feature --record.')).toEqual({
      ids: 'TGC-02,TGC-03',
      featurePath: 'src/a.feature',
    })
  })

  test('reads all from the command arguments as typed', () => {
    const dispatch = parseScenarioDispatch('Execute BDD scenario all @src/a.feature.')

    expect([dispatch, isMultiScenarioRun(dispatch?.ids ?? '')]).toEqual([
      { ids: 'all', featurePath: 'src/a.feature' },
      true,
    ])
  })

  test('ignores unrelated prompts', () => {
    expect(parseScenarioDispatch('Implement the login form')).toBeUndefined()
  })
})

describe('isMultiScenarioRun', () => {
  test('treats all and comma lists as multi-scenario runs', () => {
    expect([isMultiScenarioRun('all'), isMultiScenarioRun('A-01,A-02'), isMultiScenarioRun('A-01')]).toEqual([
      true,
      true,
      false,
    ])
  })
})

describe('parseRequestedIds', () => {
  test('splits a comma list of ids', () => {
    expect(parseRequestedIds('A-01,A-02')).toEqual(['A-01', 'A-02'])
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

  test('answers unknown without a verdict', () => {
    expect(parseScenarioResult('Done.')).toBe('unknown')
  })
})

describe('run', () => {
  const run = startRun('a.feature', 'all', parseFeatureScenarios(FEATURE))

  test('a failure skips the scenarios not yet run and finishes the run', () => {
    const failed = recordResult(markRunning(recordResult(markRunning(run, 'SMG-01'), 'SMG-01', 'passed'), 'SMG-02'), 'SMG-02', 'failed')

    expect(failed.scenarios.map(one => one.status)).toEqual(['passed', 'failed', 'skipped'])
    expect(failed.isDone).toBe(true)
  })

  test('requested ids keep only those scenarios', () => {
    expect(startRun('a.feature', ['SMG-03'], parseFeatureScenarios(FEATURE)).scenarios).toEqual([
      { id: 'SMG-03', title: 'Inline edit a string value', status: 'pending' },
    ])
  })

  test('counts describe passes, failures and skips', () => {
    expect(describeCounts(countResults(skipPending(recordResult(markRunning(run, 'SMG-01'), 'SMG-01', 'passed'))))).toBe(
      '✓1/3 ✗0 ⊘2',
    )
  })

  test('takes its owner from the loop of its first dispatch only', () => {
    const claimed = claimOwner(run, 'qa-agent')
    const started = markRunning(claimed, 'SMG-01')

    expect([claimed.ownerAgentId, claimOwner(started, 'other').ownerAgentId]).toEqual(['qa-agent', 'qa-agent'])
  })

  test('the status shows the running scenario and how many passed, and nothing once done', () => {
    const passed = recordResult(markRunning(run, 'SMG-01'), 'SMG-01', 'passed')

    expect([
      describeScenarioStatus(markRunning(passed, 'SMG-02')),
      describeScenarioStatus(passed),
      describeScenarioStatus(skipPending(passed)),
    ]).toEqual(['execute-scenario ▶ SMG-02 ✓1/3 ✗0', 'execute-scenario ✓1/3 ✗0', undefined])
  })

  test('a retry after a failure keeps the passes and runs the failed and skipped scenarios again', () => {
    const failed = recordResult(markRunning(recordResult(markRunning(run, 'SMG-01'), 'SMG-01', 'passed'), 'SMG-02'), 'SMG-02', 'failed')
    const resumed = resumeRun(failed)

    expect(resumed.scenarios.map(one => one.status)).toEqual(['passed', 'pending', 'pending'])
    expect(resumed.isDone).toBe(false)
  })

  test('only a run that failed on the same feature can resume', () => {
    const passed = skipPending(recordResult(markRunning(run, 'SMG-01'), 'SMG-01', 'passed'))
    const failed = recordResult(markRunning(run, 'SMG-01'), 'SMG-01', 'failed')

    expect([canResume(failed, 'a.feature'), canResume(failed, 'b.feature'), canResume(passed, 'a.feature')]).toEqual([
      true,
      false,
      false,
    ])
  })
})
