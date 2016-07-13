const test        = require('ava').test
const path        = require('path')

const jsonLoader  = require('../../lib/loaders/json')
const taskClasses = require('../../lib/task/classes')

const FIXTURE_FILE_PATH = path.join(__dirname, '../fixtures/launch.scripts.json5')

function take (thing, callback) {
  callback(thing)
}

test('loading JSON file', (t) => {
  const tasks = jsonLoader.loadFile(FIXTURE_FILE_PATH)

  t.deepEqual(
    Object.keys(tasks).sort(),
    [ 'default', 'defaultAsArray', 'willFail', 'willWork' ]
  )

  ///////////////////
  // Task "default":

  take(tasks.default, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'default')
    t.is(task.title, 'default')
    t.is(task.children.length, 2)

    take(task.children[0], (subTask) => {
      t.true(subTask instanceof taskClasses.TaskReference)
      t.is(subTask.reference, 'willWork')
      t.is(subTask.referencingTaskName, 'default')
    })
    take(task.children[1], (subTask) => {
      t.true(subTask instanceof taskClasses.TaskReference)
      t.is(subTask.reference, 'willFail')
      t.is(subTask.referencingTaskName, 'default')
    })
  })

  //////////////////////////
  // Task "defaultAsArray":

  take(tasks.defaultAsArray, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'defaultAsArray')
    t.is(task.title, 'defaultAsArray')
    t.is(task.children.length, 2)

    take(task.children[0], (subTask) => {
      t.true(subTask instanceof taskClasses.TaskReference)
      t.is(subTask.reference, 'willWork')
      t.is(subTask.referencingTaskName, 'defaultAsArray')
    })
    take(task.children[1], (subTask) => {
      t.true(subTask instanceof taskClasses.TaskReference)
      t.is(subTask.reference, 'willFail')
      t.is(subTask.referencingTaskName, 'defaultAsArray')
    })
  })


  ////////////////////
  // Task "willWork":

  take(tasks.willWork, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'willWork')
    t.is(task.title, 'willWork')
    t.is(task.children.length, 1)

    take(task.children[0], (subTask) => {
      t.true(subTask instanceof taskClasses.AnonymousCommandTask)
      t.is(subTask.title, 'npm')
    })
  })

  ////////////////////
  // Task "willFail":

  take(tasks.willFail, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'willFail')
    t.is(task.title, 'willFail')
    t.is(task.children.length, 2)

    take(task.children[0], (subTask) => {
      t.true(subTask instanceof taskClasses.AnonymousCommandTask)
      t.is(subTask.title, 'echo')
    })
    take(task.children[1], (subTask) => {
      t.true(subTask instanceof taskClasses.AnonymousCommandTask)
      t.is(subTask.title, 'exit')
    })
  })
})


// TODO: Check if the right commands are passed to shell()
