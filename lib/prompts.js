import { format } from 'util'
import { formatDistanceToNow } from 'date-fns'
import { EOL as eol } from 'os'

const indent = 2
const formatDate = date => formatDistanceToNow(date, { addSuffix: true })

const version = (tags, allEnvs) => ({
  type: 'select',
  name: 'version',
  message: 'version',
  margin: [1, 0, 0, 0],
  header: "sdfsdfsd sfsdfsd",
  choices: tags.map(({ version, envs, msg, author, date }) => ({
    value: version,
    onChoice: (state, choice, i) => {
      const { styles, symbols } = state
      const fmtDate = formatDate(date)
      const { length } = [msg, author, fmtDate].join(' ')
      const excess = length - (state.width - indent)
      const trimmed = excess > 0 ? msg.slice(0, msg.length - (excess + 1)) + symbols.ellipsis : msg
      const focused = i === state.index
      const isDeployedToAllEnvs = envs.sort().toString() === allEnvs.sort().toString()
      choice.message = isDeployedToAllEnvs ? styles.default.dim(version) : styles.default.bold(version)
      choice.disabled = isDeployedToAllEnvs
      choice.hint = format(`%s %s${eol}${' '.repeat(indent)}%s %s %s${eol}`,
        styles.warning.bold(envs.map(e => `${symbols.leftAngle}${e}`).join(' ')),
        isDeployedToAllEnvs ? styles.default.dim.italic('deployed everywhere!') : '',
        focused ? styles.default(trimmed) : styles.default.dim(trimmed),
        focused ? styles.primary(author) : styles.primary.dim(author),
        focused ? styles.success(fmtDate) : styles.success.dim(fmtDate))
    }
  }))
})

const environments = decoratedEnvs => ({
  type: 'multiselect',
  name: 'envs',
  message: 'environments',
  margin: [1, 0, 0, 0],
  hint: 'select with <space>',
  choices: decoratedEnvs.map(({ name, version, deployedDate, delta }) => ({
    value: name,
    onChoice: (state, choice, i) => {
      const { styles, symbols, answers: { version: selectedVersion } } = state
      const fmtDate = deployedDate ? `deployed ${formatDate(new Date(deployedDate))}` : ''
      const getDelatMsg = selectedVersion => {
        const d = delta(selectedVersion)
        if (d > 0) return `${Math.abs(d)} behind`
        if (d < 0) return `${Math.abs(d)} ahead of`
        return `Already has`
      }
      const msg = `Currently at ${version}`
      const { length } = [msg, fmtDate].join(' ')
      const excess = length - (state.width - indent)
      const trimmed = excess > 0 ? msg.slice(0, msg.length - (excess + 1)) + symbols.ellipsis : msg
      const focused = i === state.index
      const isAlreadyDeployed = version === selectedVersion
      choice.message = isAlreadyDeployed ? styles.default.dim(name) : styles.default.bold(name)
      choice.disabled = isAlreadyDeployed
      choice.hint = format(`%s${eol}${' '.repeat(indent)}%s %s${eol}`,
        version ? styles.warning(`${symbols.leftAngle}${getDelatMsg(selectedVersion)} ${styles.bold(selectedVersion)}`) : '',
        focused ? styles.default(trimmed) : styles.default.dim(trimmed),
        focused ? styles.primary(fmtDate) : styles.primary.dim(fmtDate))
    }
  })),
  validate: e => e.length > 0
    ? true : 'select environments with <space>'
})

const confirm = serviceName => ({
  type: 'toggle',
  name: 'confirm',
  hint: serviceName,
  enabled: 'deploy',
  disabled: 'cancel'
})

export default { version, environments, confirm }
