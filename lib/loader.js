'use strict'

const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')

const util = require('./util')
require('babel-register')

function loadTasksFromFile (filePath) {
  if (filePath.match(/\.json$/i)) {
    return loadTasksFromJsonFile(filePath, (fileData) => JSON.parse(fileData))
  } else if (filePath.match(/\.json5$/i)) {
    return loadTasksFromJsonFile(filePath, (fileData) => JSON5.parse(fileData))
  } else {
    return loadTasksFromJsFile(filePath)
  }
}

function loadTasksFromJsonFile (filePath, decoder) {
  return decoder(fs.readFileSync(filePath, { encoding: 'utf-8' }))
}

function loadTasksFromJsFile (filePath) {
  if (filePath.charAt(0) !== '/' && filePath.charAt(0) !== '.') {
    filePath = path.join(process.cwd(), filePath)
  }
  return require(filePath)
}

exports.loadTasksFromFile = loadTasksFromFile
exports.shell = util.shell
