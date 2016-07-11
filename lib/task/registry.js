'use strict'

const allTasksByName = {}

function registerTask (task) {
  if (allTasksByName[ task.name ]) {
    throw new Error(`Attempted double definition of task "${task.name}"`)
  }

  allTasksByName[ task.name ] = task
  return task
}

function getTaskByName (name) {
  return allTasksByName[ name ]
}

exports.registerTask = registerTask
exports.getTaskByName = getTaskByName
