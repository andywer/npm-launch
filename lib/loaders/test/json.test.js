const test        = require('ava').test
const path        = require('path')
const sinon       = require('sinon')
const rewire      = require('rewire')
const Observable  = require('zen-observable')

const jsonLoader  = rewire('../json')
const taskClasses = require('../../task/classes')

const FIXTURE_FILE_PATH = path.join(__dirname, '../../../test/fixtures/launch.scripts.json5')

const shellObservable = sinon.spy(() => new Observable((observer) => observer.complete()))
jsonLoader.__set__('shellObservable', shellObservable)

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
    [ 'default', 'defaultAsArray', 'parallel', 'sleep1', 'sleep2', 'willFail', 'willWork' ]
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
      t.is(subTask.title, 'git push')
    })
  })
})

test('task "parallel"', (t) => {
  take(tasks.parallel, (task) => {
    t.true(task instanceof taskClasses.TaskFork)
    t.is(task.name, 'parallel')
    t.is(task.title, 'parallel')
    t.is(task.children.length, 1)
  })

  take(tasks.parallel.children[0], (task) => {
    t.true(task instanceof taskClasses.AnonymousConcurrentTaskFork)
    t.is(task.title, 'run-parallel sleep1 sleep2')
    t.is(task.children.length, 2)

    take(task.children[0], (taskReference) => {
      t.true(taskReference instanceof taskClasses.TaskReference)
      t.is(taskReference.reference, 'sleep1')
      t.is(taskReference.referencingTaskName, 'parallel')
    })

    take(task.children[1], (taskReference) => {
      t.true(taskReference instanceof taskClasses.TaskReference)
      t.is(taskReference.reference, 'sleep2')
      t.is(taskReference.referencingTaskName, 'parallel')
    })
  })
})

test('tasks actually run shell commands', (t) => {
  ///////////////////
  // Task "willWork"

  t.false(shellObservable.called)
  runTask(tasks.willWork)
  t.is(shellObservable.callCount, 1)
  t.true(shellObservable.calledWith('npm --version'))
  shellObservable.reset()

  ///////////////////
  // Task "willFail"

  runTask(tasks.willFail)
  t.is(shellObservable.callCount, 1)
  t.true(shellObservable.calledWith('git push not-existent'))
  shellObservable.reset()
})
