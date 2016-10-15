'use strict'

function loadTasksFromFile (filePath, taskCallEmitter) {
  // Moved the loaders into here, since especially the JS loader is pretty expensive

  if (filePath.match(/\.json5?$/i)) {
    const loadTasksFromJsonFile = require('./loaders/json').loadFile
    return loadTasksFromJsonFile(filePath, taskCallEmitter)
  } else {
    const loadTasksFromJsFile = require('./loaders/js').loadFile
    return loadTasksFromJsFile(filePath, taskCallEmitter)
  }
}

exports.loadTasksFromFile = loadTasksFromFile
