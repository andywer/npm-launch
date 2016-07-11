'use strict'

const classes = require('./classes')
const Task = classes.Task
const TaskLeaf = classes.TaskLeaf
const AnonymousCommandTask = classes.AnonymousCommandTask
const TaskFork = classes.TaskFork
const TaskReference = classes.TaskReference

const registerTask = require('./registry').registerTask

function createTaskFromMethod (name, method) {
  return registerTask(new TaskLeaf(name, method))
}

function createAnonymousCommandTask (title, method) {
  return new AnonymousCommandTask(title, method)
}

function createTaskFork (name, subTasks) {
  subTasks.forEach((subTask) => {
    if (!(subTask instanceof Task) && !(subTask instanceof TaskReference)) {
      throw new Error(`Error creating task "${name}": Found invalid sub-task: ${subTask} (type ${typeof subTask})`)
    }
  })
  return registerTask(new TaskFork(name, subTasks))
}

function createTaskReference (referencedTaskName, referencingTaskName) {
  return new TaskReference(referencedTaskName, referencingTaskName)
}

function createListrTaskItemFor (task, taskCallsObservable) {
  if (!(task instanceof Task) && !(task instanceof TaskReference)) {
    throw new Error(`Expected Task or TaskReference. Instead got: ${task} (type ${typeof task})`)
  }

  return task.createListrTask(taskCallsObservable)
}

exports.createFromMethod = createTaskFromMethod
exports.createAnonymousCommand = createAnonymousCommandTask
exports.createFork = createTaskFork
exports.createReference = createTaskReference
exports.createListrTaskItemFor = createListrTaskItemFor
