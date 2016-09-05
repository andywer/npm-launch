const camelcase = require('camelcase')
const Observable = require('zen-observable')
const createTaskFork = require('./task').createFork

/**
 * @param {object}        allTasks      { <task name>: <function> }
 * @param {Array<string>} taskNamesToRun
 * @param {EventEmitter}  taskCallEmitter
 * @return {Promise}
 */
function runTasks (allTasks, taskNamesToRun, taskCallEmitter) {
  const tasksToRun = selectTasks(allTasks, taskNamesToRun)

  const taskCalls = new Observable((observer) => {
    taskCallEmitter.on('call', (taskName) => observer.next(taskName))
  })

  const rootTask = createTaskFork('$root', tasksToRun)
  const listrRoot = rootTask.createListrTask(taskCalls).task()

  return listrRoot.run()
}

function selectTasks (tasks, taskNamesToRun) {
  const filteredTasks = []

  taskNamesToRun.forEach((taskName) => {
    const camelCasedTaskName = camelcase(taskName)

    if (tasks[ taskName ]) {
      filteredTasks.push(tasks[ taskName ])
    } else if (tasks[ camelCasedTaskName ]) {
      filteredTasks.push(tasks[ camelCasedTaskName ])
    } else {
      throw new Error(`Task is not defined: ${taskName}`)
    }
  })

  return filteredTasks
}

exports.runTasks = runTasks
