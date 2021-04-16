import { spawn } from 'child_process'
import async from 'async'

const deploy = (env, version) => cb => {
  spawn('yarn', ['run', 'deploy', version, env], { stdio: 'inherit' })
    .on('exit', cb)
}

export default (envs, version) => async.series(envs.map(env => deploy(env, version)))
