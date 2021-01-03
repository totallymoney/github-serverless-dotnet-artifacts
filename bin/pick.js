#!/usr/bin/env node

import enq from 'enquirer'
import p from '../lib/prompts.js'
import getTags from '../lib/tags.js'
import deploy from '../lib/deploy.js'
import { envs, count, sls } from '../lib/config.js'

console.clear()

getTags(envs, count, sls)
  .then(tags => enq.prompt([
    p.version(tags),
    p.environments(envs),
    p.confirm(sls.service)
  ]))
  .then(({ version, envs: e, confirm }) => {
    if (confirm) deploy(e, version)
  })
  .catch(console.error)
