const Listr = require('listr')
const Observable = require('zen-observable')
const npmRun = require('npm-run')
const loader = require('./loader')

function shell (command) {
  return new Promise((resolve, reject) => {
    npmRun(command, {}, (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }
      resolve({ stdout, stderr })
    })
  })
}

/**
 * @param {object} tasks    { <task name>: <function|string> }
 * @return {Promise}
 */
function runTasks (tasks, allTasks) {
  const taskNames = Object.keys(tasks)
  const taskCalls = new Observable((observer) => observeTasks(allTasks, observer))

  const taskList = taskNames.map((taskName) => {
    return {
      title: taskName,
      task: () => new Observable((observer) => {
        taskCalls
          .filter((calledTaskName) => calledTaskName !== taskName)
          .subscribe(observer)

        runTask(tasks[ taskName ], taskName)
          .then(() => observer.complete())
          .catch((error) => observer.error(error))
      })
    }
  })

  return new Listr(taskList).run()
}

function observeTasks (tasks, observer) {
  Object.keys(tasks)
  .filter((taskName) => typeof tasks[ taskName ] === 'function' && !taskName.match(/^__/))
  .forEach((taskName) => {
    const origMethod = tasks[ taskName ]

    tasks.__Rewire__(taskName, () => {
      observer.next(taskName)
      return origMethod.apply(null, arguments)
    })
  })
}

/**
 * @param {function|string} task
 * @param {string} taskName
 * @return {Promise}
 */
function runTask (task, taskName) {
  switch (typeof task) {
    case 'function':
      return task()
    case 'string':
      return shell(task)
    default:
      throw new Error(`Task must be function or string. Invalid task given: ${taskName} (type is ${typeof task})`)
  }
}

exports.shell = shell
exports.runTasks = runTasks
exports.loadTasksFromFile = loader.loadTasksFromFile
