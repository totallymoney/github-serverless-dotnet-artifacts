import local from './local.js'
import github from './github.js'

const strategies =
  [local, github].filter(s => s.supported)

export const prompt = {
  skip: strategies.count < 2,
  default: strategies[0].name,
  choices: strategies.map(s => ({ value: s.name, hint: `${s.desc}\n` })),
  validate: Object.fromEntries(strategies.map(s => [s.name, s.validate]))
}

export const deploy =
  Object.fromEntries(strategies.map(s => [s.name, s.deploy]))
