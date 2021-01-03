import min from 'minimist'
import yaml from 'js-yaml'
import { readFileSync } from 'fs'

const defaultCount = 7
const defaultEnvs = ['stage', 'prod']
const { c, e } = min(process.argv.slice(2))

export const count = c || defaultCount
export const envs = e ? Array.isArray(e) ? e : [e] : defaultEnvs
export const sls = yaml.safeLoad(readFileSync('serverless.yml'))
