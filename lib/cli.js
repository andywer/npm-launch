#!/usr/bin/env node
'use strict'

const colors = require('colors')
const EventEmitter = require('events')
const fs = require('fs')

const argv = require('yargs')
  .usage('Usage: $0 [<task to run> ...] [<options>]')
  .example('$0', 'Runs task "default" from file "launch.scripts.{js,json,json5}".')
  .example('$0 build test', 'Runs task "build" and then "test".')
  .example('$0 -f filename.js foo', 'Runs task "foo" of task file "filename.js".')
  .example('$0 --list', 'Lists all available tasks.')
  .describe('f', 'Specify input file')
  .nargs('f', 1)
  .alias('f', 'file')
  .describe('list', 'List all available tasks')
  .describe('no-color', 'Prevents output from being colored')   // require('colors') will check for --no-color
  .help()
  .alias('h', 'help')
  .version()
  .argv

const loader = require('./loader')
const taskRunner = require('./index')

const DEFAULT_INPUT_FILENAMES = [ 'launch.scripts.js', 'launch.scripts.json', 'launch.scripts.json5' ]

process.title = 'npm-launch'

try {
  main(argv)
} catch (error) {
  console.error(error.stack)
}

function main (args) {
  const taskFile = args.file ? checkTasksFile(args.file) : locateTasksFile()
  const tasksToRun = args._.length > 0 ? args._ : [ 'default' ]

  // This emitter will be used to inform subscribers about calls on methods
  // if the taskFile is an ES6 module (JS code)
  const taskCallEmitter = new EventEmitter()

  const tasks = loader.loadTasksFromFile(taskFile, taskCallEmitter)
  beforeRunningTasks(args, tasks, taskFile)
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

function beforeRunningTasks (args, tasks, taskFile) {
  if (args.list) {
    printAvailableTasks(tasks, taskFile)
    process.exit(0)
  }
}

function printAvailableTasks (tasks, taskFile) {
  const taskNames = Object.keys(tasks)

  console.log(`Tasks in ${taskFile}:`)
  taskNames.sort().forEach((taskName) => console.log(`  ${taskName}`))
}

function runTasks (allTasks, taskCallEmitter, taskNamesToRun) {
  return taskRunner
    .runTasks(allTasks, taskNamesToRun, taskCallEmitter)
    .catch((error) => {
      if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
        console.error(colors.red(error.message))
      } else if (error instanceof Error) {
        console.error(colors.red(error.stack))
      } else {
        console.error(colors.red(error))
      }
      process.exit(1)
    })
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
