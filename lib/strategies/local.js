import { spawnSync } from 'child_process'

export default {
  name: 'local',
  desc: 'download and deploy artifacts from your machine',
  supported: true,
  validate: _ => true,
  deploy: (env, version) => {
    // spawnSync('ls', ['-l'], { stdio: 'inherit' })
    spawnSync('yarn', ['run', 'deploy', version, env], { stdio: 'inherit' })
    return Promise.resolve()
  }
} 
