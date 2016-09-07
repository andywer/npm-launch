'use strict'

const fs = require('fs')
const JSON5 = require('json5')
const taskModule = require('../task')
const util = require('../util')
let shellObservable = util.shellObservable      // must be `let`, since rewiring in unit tests would fail otherwise

const createAnonymousCommandTask = taskModule.createAnonymousCommand
const createTaskFork = taskModule.createFork
const createAnonymousConcurrentTaskFork = taskModule.createAnonymousConcurrentTaskFork
const createTaskReference = taskModule.createReference

function loadFile (filePath) {
  const tasksJson = JSON5.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }))
  const tasksResolved = {}

  Object.keys(tasksJson).forEach((taskName) => {
    tasksResolved[ taskName ] = resolveJsonTask(tasksJson[ taskName ], taskName, tasksResolved)
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
  const commandRun = /^run /i
  const commandRunParallel = /^(run-p|run-parallel) /i

  if (subCommand.match(commandRun)) {
    const referencedTaskName = subCommand.replace(commandRun, '').trim()
    return createTaskReference(referencedTaskName, taskName)
  } else if (subCommand.match(commandRunParallel)) {
    const spaceSeparatedSubTasks = subCommand.replace(commandRunParallel, '')
    const title = subCommand.length > 30 ? subCommand.substr(0, 30) + '...' : subCommand
    return createAnonymousConcurrencyTask(spaceSeparatedSubTasks, taskName, title)
  } else {
    const title = subCommand.replace(/\s.*$/, '')
    return createAnonymousCommandTask(title, () => shellObservable(subCommand))
  }
}

function createAnonymousConcurrencyTask (spaceSeparatedSubTasks, taskName, title) {
  const referencedTaskNames = spaceSeparatedSubTasks
    .split(' ')
    .map((subTaskName) => subTaskName.trim())
    .filter((subTaskName) => subTaskName.length > 0)

  const taskReferences = referencedTaskNames.map(
    (subTaskName) => createTaskReference(subTaskName, taskName)
  )
  return createAnonymousConcurrentTaskFork(taskName, title, taskReferences)
}

exports.loadFile = loadFile
