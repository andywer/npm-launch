/**
 * Run from command line: `launch [<task>]`
 */

const shell = module.parent.exports.shell

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
    setTimeout(() => resolve(), 1500)
  })
}

// Can even use async/await out-of-the-box
export async function fancyTasking () {
  await npmList()
  await runStandardLinter()
  await wasteSomeTime()
}

// Try `launch willFail` to see what an error looks like
export function willFail () {
  return shell('echo "Some error" >&2 && exit 1')
}

// This will set up a task "default" triggering the given tasks one after another
export default [ npmList, runStandardLinter, wasteSomeTime ]
