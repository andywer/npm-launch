'use strict'

const loadTasksFromJsonFile = require('./loaders/json').loadFile
const loadTasksFromJsFile = require('./loaders/js').loadFile

function loadTasksFromFile (filePath, taskCallEmitter) {
  if (filePath.match(/\.json5?$/i)) {
    return loadTasksFromJsonFile(filePath, taskCallEmitter)
  } else {
    return loadTasksFromJsFile(filePath, taskCallEmitter)
  }
}

exports.loadTasksFromFile = loadTasksFromFile
