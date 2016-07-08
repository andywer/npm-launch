#!/usr/bin/env node
'use strict'

const camelcase = require('camelcase')
const fs = require('fs')

const argv = require('yargs')
  .usage('Usage: $0 [<task to run> ...]')
  .example('$0', 'Runs task "default" from file "tasks.js". Will try "tasks.json" if JS file does not exist.')
  .example('$0 build test', 'Runs task "build" and then "test".')
  .help()
  .argv

const taskRunner = require('./index')
const loader = require('./loader')

main(argv)

function main (args) {
  const tasksToRun = args._.length > 0 ? args._ : [ 'default' ]
  const taskFile = locateTasksFile()

  const tasks = loader.loadTasksFromFile(taskFile)
  const filteredTasks = selectTasks(tasks, tasksToRun)

  runTasks(filteredTasks)
}

function locateTasksFile () {
  if (fileExists('tasks.js')) {
    return 'tasks.js'
  } else if (fileExists('tasks.json')) {
    return 'tasks.json'
  } else {
    throw new Error('Neither tasks.js nor tasks.json file found in current working directory.')
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
