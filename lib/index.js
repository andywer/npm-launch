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
      task: () => createListrTask(tasks, taskName, taskCalls)
    })
  )

  return new Listr(taskList)
}

function createListrTask (tasks, taskName, taskCalls) {
  const task = tasks[ taskName ]

  if (typeof task === 'function') {
    return createListrTaskByPromise(task, taskName, taskCalls)
  } else if (Array.isArray(task)) {
    return createListrByFunctionArray(task)
  } else {
    // All string tasks have been resolved to `shell()` calls by resolveAndObserveStringTasks() at this point
    throw new Error(`Task must be function, array or string. Invalid task given: ${taskName} (type is ${typeof task})`)
  }
}

function createListrTaskByPromise (method, taskName, taskCalls) {
  return new Observable((observer) => {
    // inform Listr when another task is run
    taskCalls
      .filter((calledTaskName) => calledTaskName !== taskName)
      .subscribe(observer)

    // run the initial task, map the task's promise to the observer so Listr is synced
    method()
      .then(() => observer.complete())
      .catch((error) => observer.error(error))
  })
}

function createListrByFunctionArray (subTasks) {
  return new Listr(subTasks.map((subtask) => {
    const title = subtask.displayName || subtask.name
    if (!title) {
      throw new Error(`Unnamed task array item: ${subtask}`)
    }
    return { title, task: subtask }
  }))
}

exports.runTasks = runTasks
