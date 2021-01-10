import git from 'nodegit'

const getDeployment = (lambda, name) => lambda
  .getFunctionConfiguration({ FunctionName: name })
  .promise()
  .then(({ Environment: { Variables: v } }) => ({
    version: v.VERSION,
    deployedDate: v.DEPLOYED_DATE ? new Date(v.DEPLOYED_DATE) : undefined
  }))
  .catch(() => undefined)

const getVersionEnvs = (deploys, version) => deploys
  .filter(deploy => deploy.version === version)
  .map(deploy => deploy.env)

const getTagDetails = (repo, tag) => git.Reference.lookup(repo, `refs/tags/${tag}`)
  .then(ref => git.Commit.lookup(repo, ref.target()))
  .then(commit => ({
    version: tag,
    msg: commit.summary(),
    author: commit.author().name(),
    date: new Date(commit.date())
  }))

export default async (envs, lambda, functionName) => {

  const repo = await git.Repository.open('./')

  await repo.fetch('origin', {
    callbacks: { credentials: (_, user) => git.Cred.sshKeyFromAgent(user) }
  })

  const deploys = await Promise.all(envs.map(async env => {
    const deployment = await getDeployment(lambda, functionName(env))
    return { ...deployment, env }
  })).then(deps => deps.filter(d => d.version))

  const tags = await git.Tag.list(repo)
    .then(tags => Promise.all(tags.map(tag => getTagDetails(repo, tag))))
    .then(tags => tags.sort((a, b) => b.date - a.date))
    .then(tags => tags.map(tag => ({ ...tag, envs: getVersionEnvs(deploys, tag.version) })))
    .catch(console.error)

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
