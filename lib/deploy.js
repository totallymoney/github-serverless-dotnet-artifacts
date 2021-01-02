import { spawn } from 'child_process';
import { series } from 'async';

export default (envs, version) =>
    series(envs.map(env => deploy(env, version)));

const deploy = (env, version) => cb => {
    const exec = spawn('yarn', ['run', 'deploy', version, env], { stdio: 'inherit' });
    exec.on('exit', (code) => { cb(code === 0 ? null : code); });
}
