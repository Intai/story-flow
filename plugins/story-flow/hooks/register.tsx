import type { Register } from 'claude-code'

import { registerScenarioBand } from './scenario-band/register'

export const register: Register = (on, options) => {
  registerScenarioBand(on, options)
}
