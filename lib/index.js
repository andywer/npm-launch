const Listr = require('listr')
const Observable = require('zen-observable')
const util = require('./util')
const shell = util.shell

/**
 * @param {object} allTasks    { <task name>: <function> }
 * @param {EventEmitter} taskCallEmitter
 * @param {function} selectTasksToRun   selectTasksToRun(allTasks): object<taskName:function>
 * @return {Promise}
 */
function runTasks (allTasks, taskCallEmitter, selectTasksToRun) {
  const tasks = selectTasksToRun(allTasks)

  const taskCalls = new Observable((observer) => {
    taskCallEmitter.on('call', (taskName) => observer.next(taskName))
  })

  return createListr(tasks, taskCalls).run()
}

function createListr (tasks, taskCalls) {
  const taskList = Object.keys(tasks).map((taskName) =>
    ({
      title: taskName,
      task: () => new Observable((observer) => {
        // inform Listr when another task is run
        taskCalls
          .filter((calledTaskName) => calledTaskName !== taskName)
          .subscribe(observer)

        // run the initial task, map the task's promise to the observer so Listr is synced
        runTask(tasks[ taskName ], taskName)
          .then(() => observer.complete())
          .catch((error) => observer.error(error))
      })
    })
  )

  return new Listr(taskList)
}

/**
 * @param {function|string} task
 * @param {string} taskName
 * @return {Promise}
 */
function runTask (task, taskName) {
  if (typeof task === 'function') {
    return task()
  } else {
    // All string tasks have been resolved to `shell()` calls by resolveAndObserveStringTasks() at this point
    throw new Error(`Task must be function or string. Invalid task given: ${taskName} (type is ${typeof task})`)
  }
}

exports.runTasks = runTasks
