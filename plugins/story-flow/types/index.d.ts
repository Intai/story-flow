export type ScenarioStatus = 'pending' | 'running' | 'passed' | 'failed' | 'unknown' | 'skipped'

export type Scenario = {
  id: string
  title: string
  status: ScenarioStatus
  agentId?: string
}

export type ScenarioRun = {
  featurePath: string
  scenarios: Scenario[]
  isDone: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'story-flow': { scenarioRun: ScenarioRun | null }
  }
}
