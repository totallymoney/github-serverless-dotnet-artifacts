import simpleGit from 'simple-git';
const git = simpleGit()

const getDeployment = (lambda, name) => lambda
  .getFunctionConfiguration({ FunctionName: name })
  .then(({ Environment: { Variables: v } }) => ({
    version: v.VERSION,
    deployedDate: v.DEPLOYED_DATE ? new Date(v.DEPLOYED_DATE) : undefined
  }))
  .catch(() => undefined)

const getVersionEnvs = (deploys, version) => deploys
  .filter(deploy => deploy.version === version)
  .map(deploy => deploy.env)

const enrichWithTags = log => ({
  ...log,
  tags: log.refs.split(',')
    .map(r => r.trim())
    .filter(r => r.indexOf('tag:') > -1)
    .map(r => r.replace('tag:', '').trim())
})

const buildTag = log => ({
  msg: log.message,
  version: log.tag,
  author: log.author_name,
  date: new Date(log.date),
})

export default async (envs, lambda, functionNames, buildFullFunctionName) => {

  await git.fetch()

  const deploys = await Promise.all(envs.map(async env => {
    const deployment = await getDeployment(lambda, buildFullFunctionName(env, functionNames[0]))
    return { ...deployment, env }
  })).then(deps => deps.filter(d => d.version))

  const tags = await git.log(['--tags']).then(logs => logs.all
    .map(enrichWithTags)
    .filter(log => log.tags.length > 0)
    .map(log => log.tags.map(t => ({ ...log, tag: t })))
    .flat()
    .map(buildTag)
    .sort((a, b) => b.date - a.date)
    .map(tag => ({ ...tag, envs: getVersionEnvs(deploys, tag.version) }))
  ).catch(console.error)

  const idx = version => tags.findIndex(({ version: v }) => v === version)

  const decoratedEnvs = envs.map(env => {
    const d = deploys.find(d => d.env === env) || {}
    return {
      name: env,
      ...d,
      delta: selected => idx(d.version) - idx(selected)
    }
  })

  return { tags, decoratedEnvs }
}
