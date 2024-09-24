import { fromIni } from '@aws-sdk/credential-providers';
import { Lambda } from '@aws-sdk/client-lambda';
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
export const region = sls.provider.region
export const serviceName = sls.service
export const functionNames = Object.keys(sls.functions).sort()
export const buildFullFunctionName = (env, func) => `${sls.service}-${env}-${func}`
export const lambda = new Lambda({
  region: sls.provider.region,
  credentials: fromIni({ profile: sls.provider.profile })
})
