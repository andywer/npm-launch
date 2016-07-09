const EventEmitter = require('events')
const Listr = require('listr')
const Observable = require('zen-observable')
const util = require('./util')
const shell = util.shell

/**
 * @param {object} allTasks    { <task name>: <function|string> }
 * @return {Promise}
 */
function runTasks (allTasks, selectTasksToRun) {
  const emitter = prepareTasks(allTasks)
  const tasks = selectTasksToRun(allTasks)

  const taskCalls = new Observable((observer) => {
    emitter.on('call', (taskName) => observer.next(taskName))
  })

  return createListr(tasks, taskCalls).run()
}

function prepareTasks (tasks) {
  const emitter = new EventEmitter()
  observeFunctionTasks(tasks, emitter)
  resolveAndObserveStringTasks(tasks, emitter)
  return emitter
}

function observeFunctionTasks (tasks, emitter) {
  if (!tasks.__Rewire__) { return }

  Object.keys(tasks)
    .filter((taskName) => typeof tasks[ taskName ] === 'function' && !taskName.match(/^__/))
    .forEach((taskName) => {
      const origMethod = tasks[ taskName ]

      tasks.__Rewire__(taskName, () => {
        emitter.emit('call', taskName)
        return origMethod.apply(null, arguments)
      })
    })
}

function resolveAndObserveStringTasks (tasks, emitter) {
  Object.keys(tasks)
    .filter((taskName) => typeof tasks[ taskName ] === 'string')
    .forEach((taskName) => {
      const command = tasks[ taskName ]
      tasks[ taskName ] = () => {
        emitter.emit('call', taskName)
        return shell(command)
      }
    })
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
