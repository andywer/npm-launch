const test        = require('ava').test
const path        = require('path')
const rewire      = require('rewire')
const sinon       = require('sinon')

const jsonLoader  = rewire('../../../lib/loaders/json')
const taskClasses = require('../../../lib/task/classes')

const FIXTURE_FILE_PATH = path.join(__dirname, '../../fixtures/launch.scripts.json5')

const shell = sinon.spy(() => Promise.resolve())
jsonLoader.__set__('shell', shell)

const tasks = jsonLoader.loadFile(FIXTURE_FILE_PATH)

function take (thing, callback) {
  callback(thing)
}

function runTask (task) {
  task.children.forEach((task) => task.method())
}

test('all tasks have been loaded', (t) => {
  t.deepEqual(
    Object.keys(tasks).sort(),
    [ 'default', 'defaultAsArray', 'willFail', 'willWork' ]
  )
})

test('task "default"', (t) => {
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
})

test('task "defaultAsArray"', (t) => {
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
})

test('task "willWork"', (t) => {
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
})

test('task "willFail"', (t) => {
  take(tasks.willFail, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'willFail')
    t.is(task.title, 'willFail')
    t.is(task.children.length, 1)

    take(task.children[0], (subTask) => {
      t.true(subTask instanceof taskClasses.AnonymousCommandTask)
      t.is(subTask.title, 'git')
    })
  })
})

test('running shell commands', (t) => {
  ///////////////////
  // Task "willWork"

  t.false(shell.called)
  runTask(tasks.willWork)
  t.is(shell.callCount, 1)
  t.true(shell.calledWith('npm --version'))
  shell.reset()

  ///////////////////
  // Task "willFail"

  runTask(tasks.willFail)
  t.is(shell.callCount, 1)
  t.true(shell.calledWith('git push not-existent'))
  shell.reset()
})
