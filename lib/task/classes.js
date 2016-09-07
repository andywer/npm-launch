'use strict'

const Listr = require('listr')
const Observable = require('zen-observable')

const getTaskByName = require('./registry').getTaskByName

/**
 * Abstract base class for tasks.
 */
class Task {
  constructor (name, title) {
    this.name = name
    this.title = title || name
  }
}

/**
 * Abstract base class for tasks that actually run stuff themselves.
 */
class ExecutableTask extends Task {
  createListrTask (taskCallsObservable) {
    const task = taskCallsObservable
      ? () => createObservableFor(this.method, this.name, taskCallsObservable)
      : () => this.method()

    return { title: this.title, task }
  }
}

/**
 * A TaskLeaf executes a method.
 */
class TaskLeaf extends ExecutableTask {
  constructor (name, method) {
    super(name)
    this.method = method
  }
}

/**
 * An AnonymousCommandTask is not a real task, but only some shell command.
 */
class AnonymousCommandTask extends ExecutableTask {
  constructor (title, method) {
    super(null, title)
    this.method = method
  }
}

/**
 * A TaskFork does not directly execute anything, but rather triggers other tasks.
 */
class TaskFork extends Task {
  constructor (name, children) {
    super(name)
    this.children = children || []
  }

  createListrTask (taskCallsObservable) {
    const listrSubTasks = this.children.map((task) => task.createListrTask(taskCallsObservable))

    return {
      title: this.title,
      task: () => new Listr(listrSubTasks)
    }
  }
}

class AnonymousConcurrentTaskFork extends ExecutableTask {
  constructor (title, children) {
    super(null, title)
    this.children = children
  }

  createListrTask (taskCallsObservable, listrOptions) {
    const listrSubTasks = this.children.map((task) => task.createListrTask(taskCallsObservable))

    return {
      title: this.title,
      task: () => new Listr(listrSubTasks, { concurrent: true })
    }
  }
}

/**
 * A TaskReference is just for referencing a task (which might have not been created yet)
 */
class TaskReference {
  constructor (name, referencingTaskName) {
    this.reference = name
    this.referencingTaskName = referencingTaskName
  }

  resolve () {
    const task = getTaskByName(this.reference)

    if (!task) {
      throw new Error(`Task not found: "${this.reference}" (referenced by "${this.referencingTaskName}")`)
    }
    return task
  }

  createListrTask () {
    return this.resolve().createListrTask()
  }
}

function createObservableFor (method, taskName, taskCallsObservable) {
  return new Observable((observer) => {
    // inform Listr when another task is run
    taskCallsObservable
      .filter((calledTaskName) => calledTaskName !== taskName)
      .subscribe(observer)

    // run the initial task (`method` a.k.a `taskName`), subscribe to it
    observify(() => method()).subscribe(observer)
  })
}

function observify (method) {
  return new Observable((observer) => {
    const result = method()

    if (result.subscribe) {
      // Observable, so pass through
      result.subscribe(observer)
    } else if (result.then && result.catch) {
      // Promise, so map .then/.catch to observer
      result.then((value) => {
        observer.next(value)
        observer.complete()
      }).catch((error) => {
        observer.error(error)
      })
    } else {
      // Just complete synchronously
      observer.next(result)
      observer.complete()
    }
  })
}

exports.Task = Task
exports.TaskLeaf = TaskLeaf
exports.AnonymousCommandTask = AnonymousCommandTask
exports.TaskFork = TaskFork
exports.AnonymousConcurrentTaskFork = AnonymousConcurrentTaskFork
exports.TaskReference = TaskReference
