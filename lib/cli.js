#!/usr/bin/env node
'use strict'

const camelcase = require('camelcase')
const colors = require('colors')
const EventEmitter = require('events')
const fs = require('fs')

const argv = require('yargs')
  .usage('Usage: $0 [<task to run> ...] [<options>]')
  .example('$0', 'Runs task "default" from file "launch.scripts.{js,json,json5}".')
  .example('$0 build test', 'Runs task "build" and then "test".')
  .example('$0 -f filename.js foo', 'Runs task "foo" of task file "filename.js".')
  .describe('f', 'Specify input file')
  .nargs('f', 1)
  .alias('f', 'file')
  .describe('no-color', 'Prevents output from being colored')   // require('colors') will check for --no-color
  .help()
  .alias('h', 'help')
  .version()
  .argv

const loader = require('./loader')
const taskRunner = require('./index')

const DEFAULT_INPUT_FILENAMES = [ 'launch.scripts.js', 'launch.scripts.json', 'launch.scripts.json5' ]

main(argv)

function main (args) {
  const taskFile = args.file ? checkTasksFile(args.file) : locateTasksFile()
  const tasksToRun = args._.length > 0 ? args._ : [ 'default' ]

  const taskCallEmitter = new EventEmitter()
  const tasks = loader.loadTasksFromFile(taskFile, taskCallEmitter)
  runTasks(tasks, taskCallEmitter, tasksToRun)
}

function checkTasksFile (filePath) {
  if (!fileExists(filePath)) {
    throw new Error(`File cannot be found: ${filePath}`)
  }
  return filePath
}

function locateTasksFile (filePath) {
  const located = DEFAULT_INPUT_FILENAMES.find((fileName) => fileExists(fileName))

  if (located) {
    return located
  } else {
    throw new Error('Non of the default task files found in current working directory: ' + DEFAULT_INPUT_FILENAMES.join(', '))
  }
}

function runTasks (allTasks, taskCallEmitter, taskNamesToRun) {
  taskRunner
    .runTasks(allTasks, taskCallEmitter, () => selectTasks(allTasks, taskNamesToRun))
    .catch((error) => {
      if (error instanceof Error) {
        console.error(colors.red(error.stack))
      } else {
        console.error(colors.red(error))
      }
    })
}

function selectTasks (tasks, taskNamesToRun) {
  const filteredTasks = {}

  taskNamesToRun.forEach((taskName) => {
    const camelCasedTaskName = camelcase(taskName)

    if (tasks[ taskName ]) {
      filteredTasks[ taskName ] = tasks[ taskName ]
    } else if (tasks[ camelCasedTaskName ]) {
      filteredTasks[ camelCasedTaskName ] = tasks[ camelCasedTaskName ]
    } else {
      throw new Error(`Task is not defined: ${taskName}`)
    }
  })

  return filteredTasks
}

function fileExists (filePath) {
  let stat
  try {
    stat = fs.statSync(filePath)
  } catch (error) {
    return false
  }
  return stat.isFile()
}
