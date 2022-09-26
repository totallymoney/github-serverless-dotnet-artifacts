#!/usr/bin/env node
import enq from 'enquirer'
import open from 'open'
import { envs, region, serviceName } from '../lib/config.js'

console.clear()

const environment = (allEnvs) => ({
  type: 'select',
  name: 'environment',
  margin: [1, 0, 0, 0],
  choices: allEnvs
})

enq.prompt([
  environment(envs)
])
  .then(({ environment }) => open(`https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/applications/${serviceName}-${environment}`))
  .catch(console.error)
