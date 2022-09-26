#!/usr/bin/env node
import enq from 'enquirer'
import open from 'open'
import { LogsInsights, TimeType, Unit } from 'cwlogs-url-builder';
import { envs, region, functionNames, buildFullFunctionName } from '../lib/config.js'

console.clear()

const environment = (allEnvs) => ({
  type: 'select',
  name: 'environment',
  margin: [1, 0, 0, 0],
  choices: allEnvs
})

const functions = (functionNames) => ({
  type: 'multiselect',
  name: 'functions',
  margin: [1, 0, 0, 0],
  hint: 'select with <space>',
  validate: e => e.length > 0 ? true : 'select functions with <space>',
  choices: functionNames
})

const query = `\
fields @timestamp, @message
| sort @timestamp desc`

enq.prompt([
  environment(envs),
  functions(functionNames)
])
  .then(input =>
    open(new LogsInsights({
      query: query,
      timeType: TimeType.RELATIVE,
      start: -3600,
      unit: Unit.Seconds,
      logGroups: input.functions.map((f) =>
        `/aws/lambda/${buildFullFunctionName(input.environment, f)}`)
    }).toURLString(region)))
  .catch(console.error)

