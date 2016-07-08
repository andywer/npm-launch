/**
 * Run from command line: `task-runner [<task>]`
 */

const shell = require('../lib/index').shell

export function npmList () {
  // Run a shell command
  return shell('npm list')
}

export function runStandardLinter () {
  // Run a binary from node_modules/.bin
  return shell('standard --version')
}

export function wasteSomeTime () {
  return new Promise((resolve) => {
    //console.log('It is now: ', new Date())

    setTimeout(() => {
      //console.log('After waiting for 1.5s it is now: ', new Date())
      resolve()
    }, 1500)
  })
}

// can even use async/await out-of-the-box
export default async function () {
  await npmList()
  await runStandardLinter()
  await wasteSomeTime()
}

export function willFail () {
  return shell('echo "Some error" >&2 && exit 1')
}
