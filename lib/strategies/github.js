import { sync as commandExists } from 'command-exists'
import { execSync, spawnSync } from 'child_process'
import { existsSync } from 'fs'
import datefns from 'date-fns'
import { oraPromise } from 'ora'

const cmd = 'gh'

const getLatestWorkflow = () => {

  const wf = JSON.parse(
    execSync(`${cmd} run list --workflow deploy --limit 1 --json createdAt,databaseId`)
      .toString())[0]

  return {
    ...wf,
    createdAt: wf
      ? datefns.parseISO(wf.createdAt)
      : new Date(datefns.minTime)
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const retryGetWorkflowUntil = async (pred, attempts) => {

  const wf = getLatestWorkflow()

  if (pred(wf)) {
    return wf
  }

  if (attempts > 0) {
    await sleep(1000)
    return await retryGetWorkflowUntil(pred, attempts - 1)
  }

  throw new Error('could not find workflow')
}

const deploy = async (env, version) => {

  spawnSync(cmd, [
    'workflow', 'run', 'deploy',
    '-f', `version=${version}`,
    '-f', `environment=${env}`
  ], { stdio: 'inherit' })

  const recently = datefns.subSeconds(new Date(), 10)

  const wf = await oraPromise(
    retryGetWorkflowUntil(wf => datefns.isAfter(wf.createdAt, recently), 60),
    'waiting up to 60 seconds for workflow')

  spawnSync(cmd, [
    'run', 'watch', wf.databaseId], { stdio: 'inherit' })
}

export default {
  name: 'github',
  desc: 'use deploy workflow in github actions',
  supported: existsSync('.github/workflows/deploy.yml'),
  validate: _ => commandExists(cmd) ||
    `the command \`${cmd}\` does not exist, install with \`brew install ${cmd}\``,
  deploy,
} 
