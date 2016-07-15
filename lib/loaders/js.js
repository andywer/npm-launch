'use strict'

const path = require('path')

const babelPlugins = require('./_babel').plugins
const taskModule = require('../task')
const createTaskFromMethod = taskModule.createFromMethod
const createAnonymousCommandTask = taskModule.createAnonymousCommand
const createTaskFork = taskModule.createFork
const createTaskReference = taskModule.createReference
const util = require('../util')

require('babel-register')({
  babelrc: false,
  plugins: babelPlugins
})

function loadFile (filePath, taskCallEmitter) {
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

      exportedTasks.__Rewire__(taskName, function () {
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

exports.loadFile = loadFile

// This export is supposed to be used by ES6 module input files:
exports.shell = util.shell
