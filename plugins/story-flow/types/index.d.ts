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
  isDone: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'story-flow': { scenarioRun: ScenarioRun | null; storyRun: StoryRun | null }
  }
}
