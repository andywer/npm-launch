'use strict'

const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')

const util = require('./util')
const shell = util.shell
require('babel-register')

function loadTasksFromFile (filePath, taskCallEmitter) {
  if (filePath.match(/\.json$/i)) {
    return loadTasksFromJsonFile(filePath, taskCallEmitter, (fileData) => JSON.parse(fileData))
  } else if (filePath.match(/\.json5$/i)) {
    return loadTasksFromJsonFile(filePath, taskCallEmitter, (fileData) => JSON5.parse(fileData))
  } else {
    return loadTasksFromJsFile(filePath, taskCallEmitter)
  }
}

function loadTasksFromJsonFile (filePath, taskCallEmitter, decoder) {
  const tasks = decoder(fs.readFileSync(filePath, { encoding: 'utf-8' }))

  Object.keys(tasks).forEach((taskName) => {
    tasks[ taskName ] = resolveJsonTask(tasks[ taskName ], taskName, taskCallEmitter)
  })

  return tasks
}

function resolveJsonTask (task, taskName, taskCallEmitter) {
  if (typeof task !== 'string') {
    throw new Error(`Task must be a string. Invalid task given: ${taskName}`)
  }

  return () => {
    taskCallEmitter.emit('call', taskName)
    return shell(task)
  }
}

function loadTasksFromJsFile (filePath, taskCallEmitter) {
  if (filePath.charAt(0) !== '/' && filePath.charAt(0) !== '.') {
    filePath = path.join(process.cwd(), filePath)
  }
  return observeExports(require(filePath), taskCallEmitter)
}

function observeExports (exportedTasks, taskCallEmitter) {
  if (!exportedTasks.__Rewire__) {
    return exportedTasks
  }

  Object.keys(exportedTasks)
    .filter((taskName) => typeof exportedTasks[ taskName ] === 'function' && !taskName.match(/^__/))
    .forEach((taskName) => {
      const origMethod = exportedTasks[ taskName ]

      exportedTasks.__Rewire__(taskName, () => {
        taskCallEmitter.emit('call', taskName)
        return origMethod.apply(null, arguments)
      })
    })

  return exportedTasks
}

exports.loadTasksFromFile = loadTasksFromFile
exports.shell = shell
