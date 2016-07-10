const Listr = require('listr')
const Observable = require('zen-observable')
const createListrTaskItemFor = require('./data/task').createListrTaskItemFor
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

function createListr (tasks, taskCallsObservable) {
  const listrTaskItems = Object.keys(tasks).map((taskName) => {
    const listrTask = createListrTaskItemFor(tasks[ taskName ], taskCallsObservable)
    return listrTask
  })

  return new Listr(listrTaskItems)
}

exports.runTasks = runTasks
