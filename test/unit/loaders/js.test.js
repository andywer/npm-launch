const test          = require('ava').test
const path          = require('path')
const rewire        = require('rewire')
const sinon         = require('sinon')
const EventEmitter  = require('events')

const jsLoader      = rewire('../../../lib/loaders/js')
const taskClasses   = require('../../../lib/task/classes')

const FIXTURE_FILE_PATH = path.join(__dirname, '../../fixtures/launch.scripts.js')

function take (thing, callback) {
  callback(thing)
}

test('loading JS file', (t) => {
  const taskCallEmitter = new EventEmitter()
  const tasks = jsLoader.loadFile(FIXTURE_FILE_PATH, taskCallEmitter)

  t.deepEqual(
    Object.keys(tasks).sort(),
    [ 'default', 'fancyTasking', 'npmList', 'runStandardLinter', 'wasteSomeTime', 'willFail' ]
  )

  ///////////////////
  // Task "default":
  take(tasks.default, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'default')
    t.is(task.children.length, 3)
  })

  take(tasks.default.children[0], (subTask) => {
    t.true(subTask instanceof taskClasses.AnonymousCommandTask)
    t.is(subTask.title, 'npmList')
  })

  ////////////////////////
  // Task "fancyTasking":
  t.true(tasks.fancyTasking instanceof taskClasses.TaskLeaf)
  t.is(tasks.fancyTasking.name, 'fancyTasking')

  ///////////////////
  // Task "npmList":
  t.true(tasks.npmList instanceof taskClasses.TaskLeaf)
  t.is(tasks.npmList.name, 'npmList')

  /////////////////////////////
  // Task "runStandardLinter":
  t.true(tasks.runStandardLinter instanceof taskClasses.TaskLeaf)
  t.is(tasks.runStandardLinter.name, 'runStandardLinter')

  /////////////////////////
  // Task "wasteSomeTime":
  t.true(tasks.wasteSomeTime instanceof taskClasses.TaskLeaf)
  t.is(tasks.wasteSomeTime.name, 'wasteSomeTime')

  ////////////////////
  // Task "willFail":
  t.true(tasks.willFail instanceof taskClasses.TaskLeaf)
  t.is(tasks.willFail.name, 'willFail')
})

test('observeExports() works, calls cause taskCallEmitter events', (t) => {
  const fakeTasks = {
    __Rewire__,
    fakeTask (...args) {
      return 'args: ' + args.join(', ')
    },
    shouldNotBeTouched: 'some string'
  }

  function __Rewire__ (taskName, newMethod) {
    fakeTasks[ taskName ] = newMethod
  }

  const taskCallEmitter = new EventEmitter()
  const calls = []
  taskCallEmitter.on('call', (methodName) => calls.push(methodName))

  jsLoader.__get__('observeExports')(fakeTasks, taskCallEmitter)
  t.is(calls.length, 0)

  const returnValue = fakeTasks.fakeTask('foo', 'bar')
  t.deepEqual(calls, [ 'fakeTask' ])
  t.is(returnValue, 'args: foo, bar')

  t.is(fakeTasks.shouldNotBeTouched, 'some string')
})

test('task instances are created correctly', (t) => {
  const method = sinon.spy(() => 'method called')

  const fakeTasks = {
    method,
    arrayOfMethods: [ method ],
    arrayOfStrings: [ 'method' ]
  }

  const createdTasks = jsLoader.__get__('createTasksForExports')(fakeTasks)

  ////////////////////
  // fakeTask.method:
  take(createdTasks.method, (task) => {
    t.true(task instanceof taskClasses.TaskLeaf)
    t.is(task.name, 'method')
    t.is(task.title, 'method')
    t.false(method.called)
    t.is(task.method(), 'method called')
    t.true(method.called)
  })

  ////////////////////////////
  // fakeTask.arrayOfMethods:
  take(createdTasks.arrayOfMethods, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'arrayOfMethods')
    t.is(task.title, 'arrayOfMethods')
    t.is(task.children.length, 1)
  })

  take(createdTasks.arrayOfMethods.children[0], (task) => {
    t.true(task instanceof taskClasses.AnonymousCommandTask)
    t.is(task.title, 'proxy')  // the sinon spy's name is "proxy"
  })

  ////////////////////////////
  // fakeTask.arrayOfStrings:
  take(createdTasks.arrayOfStrings, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'arrayOfStrings')
    t.is(task.title, 'arrayOfStrings')
    t.is(task.children.length, 1)
  })

  take(createdTasks.arrayOfStrings.children[0], (task) => {
    t.true(task instanceof taskClasses.TaskReference)
    t.is(task.reference, 'method')
    t.is(task.referencingTaskName, 'arrayOfStrings')
  })
})
