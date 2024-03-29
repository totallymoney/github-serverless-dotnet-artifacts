import { EOL as eol } from 'os'
import { format } from 'util'
import datefns from 'date-fns'
import ntw from 'number-to-words'
import { prompt as strategies } from './strategies/index.js'

const indent = 2
const ago = date => datefns.formatDistanceToNow(date, { addSuffix: true })

const isDeployedToAllEnvs = (allEnvs, envs) =>
  allEnvs.sort().toString() === envs.sort().toString()

const version = (tags, allEnvs, count) => ({
  type: 'select',
  name: 'version',
  margin: [1, 0, 0, 0],
  autofocus: tags.findIndex(({ envs }) => isDeployedToAllEnvs(allEnvs, envs) === false),
  choices: tags.slice(0, count).map(({ version, envs, msg, author, date }) => ({
    value: version,
    onChoice: (state, choice, i) => {
      const { styles, symbols } = state
      const fmtDate = `published ${ago(date)}`
      const { length } = [msg, author, fmtDate].join(' ')
      const excess = length - (state.width - indent)
      const trimmed = excess > 0 ? msg.slice(0, msg.length - (excess + 1)) + symbols.ellipsis : msg
      const focused = i === state.index
      const deployedEverywhere = isDeployedToAllEnvs(allEnvs, envs)
      choice.message = deployedEverywhere ? styles.default.dim(version) : styles.default.bold(version)
      choice.disabled = deployedEverywhere
      choice.hint = format(`%s %s${eol}${' '.repeat(indent)}%s %s %s${eol}`,
        styles.warning.bold(envs.map(e => `${symbols.leftAngle}${e}`).join(' ')),
        deployedEverywhere ? styles.default.dim.italic('deployed everywhere!') : '',
        focused ? styles.default(trimmed) : styles.default.dim(trimmed),
        focused ? styles.primary(author) : styles.primary.dim(author),
        focused ? styles.success(fmtDate) : styles.success.dim(fmtDate))
    }
  })),
})

const environments = decoratedEnvs => ({
  type: 'multiselect',
  name: 'environments',
  margin: [1, 0, 0, 0],
  hint: 'select with <space>',
  validate: e => e.length > 0 ? true : 'select environments with <space>',
  choices: decoratedEnvs.map(({ name, version, deployedDate, delta }) => ({
    value: name,
    onChoice: (state, choice, i) => {
      const { styles, symbols, answers: { version: selectedVersion } } = state
      const delatMsg = (() => {
        const d = delta(selectedVersion)
        const n = ntw.toWords(Math.abs(d))
        const v = Math.abs(d) === 1 ? '' : 's'
        if (d > 0) return `${n} version${v} behind`
        if (d < 0) return `${n} version${v} ahead`
        return `at same version`
      })()
      const fmtDate = deployedDate ? `deployed ${ago(deployedDate)}` : ''
      const { length } = [delatMsg, fmtDate].join(' ')
      const excess = length - (state.width - indent)
      const trimmed = excess > 0 ? delatMsg.slice(0, delatMsg.length - (excess + 1)) + symbols.ellipsis : delatMsg
      const focused = i === state.index
      const isAlreadyDeployed = version === selectedVersion
      choice.message = isAlreadyDeployed ? styles.default.dim(name) : styles.default.bold(name)
      choice.disabled = isAlreadyDeployed
      choice.hint = format(`%s${eol}${' '.repeat(indent)}%s %s${eol}`,
        version ? styles.warning.bold(`${symbols.leftAngle} ${version}`) : '',
        version ? (focused ? styles.default(trimmed) : styles.default.dim(trimmed)) : '',
        version ? (focused ? styles.primary(fmtDate) : styles.primary.dim(fmtDate)) : '')
    }
  })),
})

const strategy = () => ({
  type: 'select',
  name: 'strategy',
  margin: [1, 0, 0, 0],
  skip: strategies.skip,
  initial: strategies.default,
  choices: strategies.choices,
  validate: s => strategies.validate[s]()
})

const confirm = serviceName => ({
  type: 'toggle',
  name: 'confirm',
  hint: serviceName,
  enabled: 'deploy',
  disabled: 'cancel'
})

export default { version, environments, strategy, confirm }
