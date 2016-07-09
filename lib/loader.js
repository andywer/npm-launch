'use strict'

const fs = require('fs')
const path = require('path')

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
exports.shell = util.shell
