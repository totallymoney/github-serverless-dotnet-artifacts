import aws from 'aws-sdk'
import min from 'minimist'
import yaml from 'js-yaml'
import { readFileSync } from 'fs'

const defaultCount = 7
const defaultEnvs = ['stage', 'prod']
const { c, e } = min(process.argv.slice(2))
const schema = yaml.DEFAULT_SCHEMA.extend([
  { name: '!Equals', kind: 'sequence' },
  { name: '!FindInMap', kind: 'sequence' },
  { name: '!GetAtt', kind: 'scalar' },
  { name: '!GetAZs', kind: 'scalar' },
  { name: '!ImportValue', kind: 'scalar' },
  { name: '!Join', kind: 'sequence' },
  { name: '!Ref', kind: 'scalar' },
  { name: '!Select', kind: 'sequence' },
  { name: '!Split', kind: 'sequence' },
  { name: '!Sub', kind: 'scalar' },
].map(({ name, kind }) => new yaml.Type(name, { kind })));
const sls = yaml.load(readFileSync('serverless.yml'), { schema })

export const count = c || defaultCount
export const envs = [...new Set(e ? Array.isArray(e) ? e : [e] : defaultEnvs)]
export const serviceName = sls.service
export const functionName = env => `${sls.service}-${env}-${Object.keys(sls.functions)[0]}`
export const lambda = new aws.Lambda({ region: sls.provider.region })
