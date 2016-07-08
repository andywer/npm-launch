const execa = require('execa')
const Listr = require('listr')

function shell (command) {
  return execa.shell(command)
}

/**
 * @param {object} tasks    { <task name>: <function|string> }
 * @return {Promise}
 */
function runTasks (tasks) {
  const taskNames = Object.keys(tasks)
  const taskList = taskNames.map((taskName) => {
    return {
      title: taskName,
      task: runTask(tasks[ taskName ], taskName)
    }
  })
  return new Listr(taskList).run()
}

/**
 * @param {function|string} task
 * @param {string} taskName
 * @return {Promise}
 */
function runTask (task, taskName) {
  switch (typeof task) {
    case 'function':
      return task
    case 'string':
      return () => shell(task)
    default:
      throw new Error(`Task must be function or string. Invalid task given: ${taskName} (type is ${typeof task})`)
  }
}

exports.shell = shell
exports.runTasks = runTasks
