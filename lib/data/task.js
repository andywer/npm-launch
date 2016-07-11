'use strict'

const Listr = require('listr')
const Observable = require('zen-observable')

const allTasksByName = {}

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

/**
 * A TaskReference is just for referencing a task (which might have not been created yet)
 */
class TaskReference {
  constructor (name, referencingTaskName) {
    this.reference = name
    this.referencingTaskName = referencingTaskName
  }

  resolve () {
    const task = allTasksByName[ this.reference ]

    if (!task) {
      throw new Error(`Task not found: "${this.reference}" (referenced by "${this.referencingTaskName}")`)
    }
    return task
  }

  createListrTask () {
    return this.resolve().createListrTask()
  }
}

function createTaskFromMethod (name, method) {
  return registerTask(new TaskLeaf(name, method))
}

function createAnonymousCommandTask (title, method) {
  return new AnonymousCommandTask(title, method)
}

function createTaskFork (name, subTasks) {
  subTasks.forEach((subTask) => {
    if (!(subTask instanceof Task) && !(subTask instanceof TaskReference)) {
      throw new Error(`Error creating task "${name}": Found invalid sub-task: ${subTask} (type ${typeof subTask})`)
    }
  })
  return registerTask(new TaskFork(name, subTasks))
}

function createTaskReference (referencedTaskName, referencingTaskName) {
  return new TaskReference(referencedTaskName, referencingTaskName)
}

function registerTask (task) {
  if (allTasksByName[ task.name ]) {
    throw new Error(`Attempted double definition of task "${task.name}"`)
  }

  allTasksByName[ task.name ] = task
  return task
}

function createListrTaskItemFor (task, taskCallsObservable) {
  if (!(task instanceof Task) && !(task instanceof TaskReference)) {
    throw new Error(`Expected Task or TaskReference. Instead got: ${task} (type ${typeof task})`)
  }

  return task.createListrTask(taskCallsObservable)
}

function createObservableFor (method, taskName, taskCallsObservable) {
  return new Observable((observer) => {
    // inform Listr when another task is run
    taskCallsObservable
      .filter((calledTaskName) => calledTaskName !== taskName)
      .subscribe(observer)

    // run the initial task, map the task's promise to the observer so Listr is synced
    promisify(() => method())
      .then(() => observer.complete())
      .catch((error) => observer.error(error))
  })
}

function promisify (method) {
  return Promise.resolve().then(() => method())
}

exports.createFromMethod = createTaskFromMethod
exports.createAnonymousCommand = createAnonymousCommandTask
exports.createFork = createTaskFork
exports.createReference = createTaskReference
exports.createListrTaskItemFor = createListrTaskItemFor
