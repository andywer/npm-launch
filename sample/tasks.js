/**
 * Run from command line: `task-runner [<task>]`
 */

const shell = require('../lib/index').shell

export async function npmList () {
  return await shell('npm list')
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

export default async function () {
  await npmList()
  await wasteSomeTime()
}

export function willFail () {
  return shell('echo "Some error" >&2 && exit 1')
}
