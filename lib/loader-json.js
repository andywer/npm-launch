'use strict'

const fs = require('fs')
const JSON5 = require('json5')

const taskModule = require('./data/task')
const createAnonymousCommandTask = taskModule.createAnonymousCommand
const createTaskFork = taskModule.createFork
const createTaskReference = taskModule.createReference
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

function resolveJsonTask (task, taskName, tasksResolved) {
  if (Array.isArray(task)) {
    const taskReferences = task.map((subTaskName) => createTaskReference(subTaskName, taskName))
    return createTaskFork(taskName, taskReferences)
  }
  if (typeof task !== 'string') {
    throw new Error(`Task must be a string or array. Invalid task given: ${taskName} (type ${typeof task})`)
  }

  return createTaskForTaskString(task, taskName)
}

function createTaskForTaskString (taskContent, taskName) {
  const subCommands = taskContent.split('&&').map((subCommand) => subCommand.trim())
  const subCommandTasks = subCommands.map((subCommand) => createTaskForSubCommand(subCommand, taskName))

  return createTaskFork(taskName, subCommandTasks)
}

function createTaskForSubCommand (subCommand, taskName) {
  if (subCommand.match(/^run /i)) {
    const referencedTaskName = subCommand.replace(/^run /i, '').trim()
    return createTaskReference(referencedTaskName, taskName)
  } else {
    const title = subCommand.replace(/\s.*$/, '')
    return createAnonymousCommandTask(title, () => shell(subCommand))
  }
}

exports.loadFile = loadFile
