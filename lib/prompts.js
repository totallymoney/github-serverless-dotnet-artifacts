import { format } from 'util'
import { formatDistanceToNow } from 'date-fns'
import color from 'ansi-colors'
import { EOL as eol } from 'os'

const formatHint = (i, { index, width, styles, symbols }, { envs, msg, author, date }) => {
  const indent = 2
  const fmtDate = formatDistanceToNow(date, { addSuffix: true })
  const { length } = [msg, author, fmtDate].join(' ')
  const excess = length - (width - indent)
  const trimmed = excess > 0 ? msg.slice(0, msg.length - (excess + 1)) + symbols.ellipsis : msg
  const focused = i === index
  return format(`%s${eol}${' '.repeat(indent)}%s %s %s${eol}`,
    styles.warning.bold(envs.map(e => `${symbols.leftAngle}${e}`).join(' ')),
    focused ? styles.default(trimmed) : styles.default.dim(trimmed),
    focused ? styles.primary(author) : styles.primary.dim(author),
    focused ? styles.success(fmtDate) : styles.success.dim(fmtDate))
}

const version = tags => ({
  type: 'select',
  name: 'version',
  message: 'version',
  margin: [1, 0, 0, 0],
  choices: tags.map((tag, i) => ({
    value: tag.version,
    message: color.bold(tag.version),
    hint: state => formatHint(i, state, tag)
  }))
})

const environments = envs => ({
  type: 'multiselect',
  name: 'envs',
  message: 'environments',
  margin: [1, 0, 0, 0],
  hint: 'select with <space>',
  choices: envs.map(env => ({
    value: env,
    message: color.bold(env + eol)
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
