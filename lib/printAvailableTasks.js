'use strict'

module.exports = printAvailableTasks

const taskDescriptions = {
  build: 'Build script',
  start: 'Start script',
  test: 'Run the tests',
  lint: 'Lint the code',
  smoke: 'Run smoke tests',
  coverage: 'Generate test coverage',
  watch: 'Run watcher, rebuild on change'
}

const lifecycleTasks = [ 'build', 'start', 'test' ]
const devTasks = [ 'lint', 'smoke', 'coverage', 'watch' ]

function printAvailableTasks (tasks) {
  const taskNames = Object.keys(tasks)

  const describableTasks = lifecycleTasks.concat(devTasks)
  const otherTasks = taskNames.filter((taskName) => describableTasks.indexOf(taskName) === -1)

  printTaskGroup('Lifecycle tasks', lifecycleTasks, taskNames)
  printTaskGroup('Development tasks', devTasks, taskNames)
  printTaskGroup('Other tasks', otherTasks, taskNames)
}

function printTaskGroup (title, groupTaskNames, launchFileTaskNames) {
  const formattedTasks = formatTasks(groupTaskNames, launchFileTaskNames)

  if (formattedTasks.length === 0) {
    return
  }

  console.log(`${title}:`)
  formattedTasks.forEach((formattedLine) => console.log(`  ${formattedLine}`))
  console.log('')
}

function formatTasks (taskNames, launchFileTaskNames) {
  return taskNames
    .filter((taskName) => launchFileTaskNames.indexOf(taskName) > -1)
    .map((taskName) => formatTask(taskName))
}

function formatTask (taskName) {
  const descriptionStartCol = 10

  const description = taskDescriptions[ taskName ]
  const padding = ' '.repeat(Math.max(descriptionStartCol - taskName.length, 1))

  if (description) {
    return taskName + padding + description
  } else {
    return taskName
  }
}
