'use strict'

const fs = require('fs')
const path = require('path')

require('json5')
require('babel-register')

function loadTasksFromFile (filePath) {
  if (filePath.match(/\.json$/i)) {
    return loadTasksFromJsonFile(filePath)
  } else {
    return loadTasksFromJsFile(filePath)
  }
}

function loadTasksFromJsonFile (filePath) {
  return JSON.decode(fs.readFileSync(filePath, { encoding: 'utf-8' }))
}

function loadTasksFromJsFile (filePath) {
  if (filePath.charAt(0) !== '/' && filePath.charAt(0) !== '.') {
    filePath = path.join(process.cwd(), filePath)
  }
  return require(filePath)
}

exports.loadTasksFromFile = loadTasksFromFile
