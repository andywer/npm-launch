/**
 * Run per command line as `task-runner demo.js`
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

export function willfail () {
  return shell('echo "Some error" >&2 && exit 1')
}
