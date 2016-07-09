'use strict'

const fs = require('fs')
const JSON5 = require('json5')

const util = require('./util')
const shell = util.shell

function loadFile (filePath, taskCallEmitter) {
  const tasksJson = JSON5.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
  const tasksResolved = {}

  Object.keys(tasksJson).forEach((taskName) => {
    tasksResolved[ taskName ] = resolveJsonTask(tasksJson[ taskName ], taskName, tasksResolved, taskCallEmitter)
  })

  return tasksResolved
}

function resolveJsonTask (task, taskName, tasksResolved, taskCallEmitter) {
  if (!task) {
    throw new Error(`Task not found: ${taskName}`)
  }
  if (Array.isArray(task)) {
    return task.map((subTaskName) => {
      const fn = () => tasksResolved[ subTaskName ]()
      fn.displayName = subTaskName
      return fn
    })
  }
  if (typeof task !== 'string') {
    throw new Error(`Task must be a string or array. Invalid task given: ${taskName} (type ${typeof task})`)
  }

  return () => {
    taskCallEmitter.emit('call', taskName)
    return executeJsonTask(task, tasksResolved)
  }
}

function executeJsonTask (task, tasksResolved) {
  if (!task.match(/&&/)) {
    return executeJsonSubCommand(task, tasksResolved)
  } else {
    const subCommands = task.split('&&').map((subCommand) => subCommand.trim())
    return subCommands.reduce((promise, subCommand) => {
      return promise.then(() => executeJsonSubCommand(subCommand, tasksResolved))
    }, Promise.resolve())
  }
}

function executeJsonSubCommand (subCommand, tasksResolved) {
  if (subCommand.match(/^run /i)) {
    const task = subCommand.replace(/^run /i, '').trim()
    return tasksResolved[ task ]()
  } else {
    return shell(subCommand)
  }
}

exports.loadFile = loadFile
