#!/usr/bin/env node
'use strict'

const camelcase = require('camelcase')
const fs = require('fs')

const argv = require('yargs')
  .usage('Usage: $0 [<task to run> ...] [<options>]')
  .example('$0', 'Runs task "default" from file "tasks.js". Will try "tasks.json" if JS file does not exist.')
  .example('$0 build test', 'Runs task "build" and then "test".')
  .example('$0 -f filename.js foo', 'Runs task "foo" of task file "filename.js".')
  .describe('f', 'Specify input file')
  .nargs('f', 1)
  .alias('f', 'file')
  .help()
  .alias('h', 'help')
  .argv

const taskRunner = require('./index')

main(argv)

function main (args) {
  const tasksToRun = args._.length > 0 ? args._ : [ 'default' ]
  const taskFile = args.file ? checkTasksFile(args.file) : locateTasksFile()

  const tasks = taskRunner.loadTasksFromFile(taskFile)
  const filteredTasks = selectTasks(tasks, tasksToRun)

  runTasks(filteredTasks)
}

function checkTasksFile (filePath) {
  if (!fileExists(filePath)) {
    throw new Error(`File cannot be found: ${filePath}`)
  }
  return filePath
}

function locateTasksFile (filePath) {
  const defaultFileNames = [ 'tasks.js', 'tasks.json', 'tasks.json5' ]

  const located = defaultFileNames.find((fileName) => fileExists(fileName))

  if (located) {
    return located
  } else {
    throw new Error('Non of the default task files found in current working directory: ' + defaultFileNames.join(', '))
  }
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

function runTasks (tasks) {
  taskRunner
    .runTasks(tasks)
    .catch((error) => {
      if (error instanceof Error) {
        console.error(error.stack)
      } else {
        console.error(error)
      }
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
