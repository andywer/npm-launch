'use strict'

const fs = require('fs')
const path = require('path')

const createTaskFromMethod = require('./data/task').createFromMethod
const createAnonymousCommandTask = require('./data/task').createAnonymousCommand
const createTaskFork = require('./data/task').createFork
const createTaskReference = require('./data/task').createReference
const loadTasksFromJsonFile = require('./loader-json').loadFile
const util = require('./util')
require('babel-register')

function loadTasksFromFile (filePath, taskCallEmitter) {
  if (filePath.match(/\.json5?$/i)) {
    return loadTasksFromJsonFile(filePath, taskCallEmitter)
  } else {
    return loadTasksFromJsFile(filePath, taskCallEmitter)
  }
}

function loadTasksFromJsFile (filePath, taskCallEmitter) {
  if (filePath.charAt(0) !== '/' && filePath.charAt(0) !== '.') {
    filePath = path.join(process.cwd(), filePath)
  }

  const exports = require(filePath)

  observeExports(exports, taskCallEmitter)
  return createTasksForExports(exports)
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
}

function createTasksForExports (exportedTasks) {
  const tasks = {}

  Object.keys(exportedTasks)
    .filter((taskName) => typeof exportedTasks[ taskName ] === 'function' && !taskName.match(/^__/))
    .forEach((taskName) => {
      tasks[ taskName ] = createTaskFromMethod(taskName, exportedTasks[ taskName ])
    })

  Object.keys(exportedTasks)
    .filter((taskName) => Array.isArray(exportedTasks[ taskName ]))
    .forEach((taskName) => {
      const subTasks = exportedTasks[ taskName ].map((item) => createTaskReferenceForArrayItem(item, taskName))
      tasks[ taskName ] = createTaskFork(taskName, subTasks)
    })

  return tasks
}

function createTaskReferenceForArrayItem (item, arrayTaskName) {
  switch (typeof item) {
    case 'function':
      return createAnonymousCommandTask(item.name, item)
    case 'string':
      return createTaskReference(item, arrayTaskName)
    default:
      throw new Error(`Tasks defined as array must include string and function items only. Check "${arrayTaskName}".`)
  }
}

exports.loadTasksFromFile = loadTasksFromFile
exports.shell = util.shell
