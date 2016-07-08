/**
 * Run per command line as `task-runner demo.js`
 */

const taskRunner = require('../lib/index')

export async function npmList () {
  return await taskRunner.shell('npm list')
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
  npmList()
  await wasteSomeTime()
}
