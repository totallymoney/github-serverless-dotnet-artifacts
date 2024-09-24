#!/usr/bin/env node

import { oraPromise } from 'ora'
import { execSync } from 'child_process'
import enq from 'enquirer'
import p from '../lib/prompts.js'
import getTags from '../lib/tags.js'
import deploy from '../lib/deploy.js'
import { envs, count, lambda, serviceName, functionNames, buildFullFunctionName }
  from '../lib/config.js'

console.clear()
execSync("aws sts get-caller-identity --no-cli-pager || aws sso login")

// /*
const tags = getTags(envs, lambda, functionNames, buildFullFunctionName) // */

/* handy stub for faster local iteration
const tags = Promise.resolve({
  tags: [{ envs: [], msg: 'test', version: '0.0.0', date: new Date() }],
  decoratedEnvs: [{ name: 'test1', delta: _ => 0 }, { name: 'test2', delta: _ => 0 }]
}) // */

oraPromise(tags, 'loading')
  .then(({ tags, decoratedEnvs }) =>
    enq.prompt([
      p.version(tags, envs, count),
      p.environments(decoratedEnvs),
      p.strategy(),
      p.confirm(serviceName),
    ]))
  .then(input => input.confirm ? deploy(input, serviceName) : -1)
  .catch(console.error)
