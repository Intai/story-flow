export type ParsedTask = { number: number; label: string }
export type ParsedGroup = { heading: string; tasks: ParsedTask[] }
export type TaskResult = 'completed' | 'failed' | 'unknown'

const STORY_DISPATCH = /(?:Execute tasks according to|Implement(?: story)?(?: markdown)?(?: according to)?)\s+@(\S+?\.md)\b/g
const TASK_PREFIX = /^\s*Task (\d+):/
const TASKS_SECTION = /^##\s+Tasks\s*$/
const NEXT_SECTION = /^##\s/
const GROUP_HEADING = /^\*\*(.+?):?\*\*:?\s*$/
const NUMBERED_TASK = /^(\d+)\.\s+(.+)$/
const BULLET_TASK = /^[-*]\s+(.+)$/
const AGENT_TASK = /^Use\s+(\S+?)\s+subagent\s+to\s+(.+)$/i
const AGENT_ROLE_SUFFIX = /-(developer|tester|automator)$/
const DANGLING_PREPOSITION = /\s+(in|at|to|for|from|of|on)$/i

// Every story path a prompt names, in order: a skill's own examples name placeholder paths too.
export function parseStoryDispatches(text: string): string[] {
  return [...text.matchAll(STORY_DISPATCH)].flatMap(([, storyPath]) => (storyPath ? [storyPath] : []))
}

export function parseTaskNumber(prompt: string): number | undefined {
  const digits = TASK_PREFIX.exec(prompt)?.[1]

  return digits === undefined ? undefined : Number(digits)
}

export function describeTask(text: string): string {
  const withoutPaths = text
    .replace(TASK_PREFIX, '')
    .replace(/\s+@\S+/g, '')
    .trim()
    .replace(DANGLING_PREPOSITION, '')
  const [, agent, work] = AGENT_TASK.exec(withoutPaths) ?? []

  return agent && work ? `${agent.replace(AGENT_ROLE_SUFFIX, '')}: ${work}` : withoutPaths
}

function readTasksSection(markdown: string): string[] {
  const lines = markdown.split('\n')
  const start = lines.findIndex(line => TASKS_SECTION.test(line))

  if (start === -1) return []

  const rest = lines.slice(start + 1)
  const end = rest.findIndex(line => NEXT_SECTION.test(line))

  return end === -1 ? rest : rest.slice(0, end)
}

export function parseTaskGroups(markdown: string): ParsedGroup[] {
  const groups: ParsedGroup[] = []
  let current: ParsedGroup | undefined
  let count = 0

  const addTask = (number: number, text: string) => {
    if (current === undefined) {
      current = { heading: 'Tasks', tasks: [] }
      groups.push(current)
    }
    current.tasks.push({ number, label: describeTask(text) })
    count = number
  }

  for (const line of readTasksSection(markdown)) {
    const heading = GROUP_HEADING.exec(line)?.[1]
    const [, digits, numbered] = NUMBERED_TASK.exec(line) ?? []
    const bullet = BULLET_TASK.exec(line)?.[1]

    if (heading !== undefined) {
      current = { heading, tasks: [] }
      groups.push(current)
    } else if (digits !== undefined && numbered !== undefined) {
      addTask(Number(digits), numbered)
    } else if (bullet !== undefined) {
      addTask(count + 1, bullet)
    }
  }

  return groups.filter(group => group.tasks.length > 0)
}

export function parseTaskResult(text: string): TaskResult {
  if (/\bfailed\b/i.test(text)) return 'failed'
  if (/\bcompleted\b/i.test(text)) return 'completed'

  return 'unknown'
}

// A turn's answer is a verdict only when it leads with one, as the skill asks; a turn that waits on
// agents of its own may mention a failure it is still fixing.
export function parseTaskVerdict(text: string): TaskResult {
  const verdict = /^\W*(completed|failed)\b/i.exec(text.trim())?.[1]?.toLowerCase()

  return verdict === 'completed' || verdict === 'failed' ? verdict : 'unknown'
}
