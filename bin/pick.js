#!/usr/bin/env node

import ora from 'ora'
import enq from 'enquirer'
import p from '../lib/prompts.js'
import getTags from '../lib/tags.js'
import deploy from '../lib/deploy.js'
import { envs, count, lambda, serviceName, functionName }
  from '../lib/config.js'

const tags = getTags(envs, lambda, functionName)
console.clear()
ora.promise(tags, 'loading')

tags.then(({ tags, decoratedEnvs }) =>
  enq.prompt([
    p.version(tags, envs, count),
    p.environments(decoratedEnvs),
    p.confirm(serviceName),
  ]))
  .then(({ version, envs: e, confirm }) => {
    if (confirm) deploy(e, version)
  })
  .catch(console.error)
