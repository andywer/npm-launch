const test = require('ava').test
const path = require('path')
const rewire = require('rewire')
const EventEmitter = require('events')

const taskClasses = require('../../lib/task/classes')

const FIXTURE_FILE_PATH = path.join(__dirname, '../fixtures/launch.scripts.js')

function take (thing, callback) {
  callback(thing)
}

test('loading JS file', (t) => {
  const jsLoader = require('../../lib/loaders/js')

  const taskCallEmitter = new EventEmitter()
  const tasks = jsLoader.loadFile(FIXTURE_FILE_PATH, taskCallEmitter)

  t.deepEqual(
    Object.keys(tasks).sort(),
    [ 'default', 'fancyTasking', 'npmList', 'runStandardLinter', 'wasteSomeTime', 'willFail' ]
  )

  ///////////////////
  // Task "default":
  t.true(tasks.default instanceof taskClasses.TaskFork)
  t.is(tasks.default.name, 'default')
  t.is(tasks.default.children.length, 3)

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
  const jsLoader = require('../../lib/loaders/js')

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

  jsLoader.observeExports(fakeTasks, taskCallEmitter)
  t.is(calls.length, 0)

  const returnValue = fakeTasks.fakeTask('foo', 'bar')
  t.deepEqual(calls, [ 'fakeTask' ])
  t.is(returnValue, 'args: foo, bar')

  t.is(fakeTasks.shouldNotBeTouched, 'some string')
})

// TODO: Test if Listr items are created as expected (test each task; rewire `shell()`)
