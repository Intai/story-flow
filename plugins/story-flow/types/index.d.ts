export type ScenarioStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'unit-tested'
  | 'unit-test-gap'
  | 'unknown'
  | 'skipped'

export type Scenario = {
  featurePath: string
  id: string
  title: string
  status: ScenarioStatus
  agentId?: string
}

export type ScenarioRun = {
  featurePaths: string[]
  scenarios: Scenario[]
  ownerAgentId?: string
  isDone: boolean
}

export type StoryTaskStatus = 'waiting' | 'running' | 'completed' | 'failed' | 'unknown'

export type StoryTask = {
  number: number
  label: string
  status: StoryTaskStatus
  agentId?: string
}

export type StoryGroup = {
  heading: string
  tasks: StoryTask[]
}

export type StoryRun = {
  storyPath: string
  groups: StoryGroup[]
  ownerAgentId?: string
  nextSlicePaths?: string[]
  isDone: boolean
}

declare module 'claude-code' {
  interface PluginState {
    // Shaped: a run stored by the single-feature version reads as none after a reload.
    'story-flow': { scenarioRun: Shaped<ScenarioRun | null>; storyRun: StoryRun | null }
  }
}
