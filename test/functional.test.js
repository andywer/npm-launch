const test  = require('ava').test
const execa = require('execa')
const path  = require('path')

process.chdir('./fixtures')

const NPM_LAUNCH = '../../lib/cli.js'

test('running npm-launch --help', () => {
  // will reject the returned Promise if something goes wrong
  // (test with: execa.shell(`${NPM_LAUNCH} -f`))
  return execa.shell(`${NPM_LAUNCH} --help`)
})

test('running npm-launch --list', async (t) => {
  const { stdout } = await execa.shell(`${NPM_LAUNCH} --list`)
  const expectedTasks = [ 'default', 'fancyTasking', 'npmList', 'runStandardLinter', 'wasteSomeTime', 'willFail' ]
  const expectedOutput = `Tasks in launch.scripts.js:\n${expectedTasks.map((taskName) => `  ${taskName}`).join('\n')}`
  t.is(stdout, expectedOutput)
})

test('running npm-launch', () => {
  return execa.shell(`${NPM_LAUNCH}`)
})

test('running npm-launch default', () => {
  return execa.shell(`${NPM_LAUNCH} default`)
})

test('running npm-launch fancyTasking', () => {
  return execa.shell(`${NPM_LAUNCH} fancyTasking`)
})

test('running npm-launch fancy-tasking', () => {
  return execa.shell(`${NPM_LAUNCH} fancy-tasking`)
})

test('running npm-launch willFail', (t) => {
  return t.throws(execa.shell(`${NPM_LAUNCH} willFail`))
})

test('running npm-launch -f launch.scripts.json5 willWork', () => {
  return execa.shell(`${NPM_LAUNCH} -f launch.scripts.json5 willWork`)
})

test('running npm-launch -f launch.scripts.json5 willFail', (t) => {
  return t.throws(execa.shell(`${NPM_LAUNCH} -f launch.scripts.json5 willFail`))
})
