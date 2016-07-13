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

test('running npm-launch', () => {
  return execa.shell(`${NPM_LAUNCH}`)
})

test('running npm-launch default', () => {
  return execa.shell(`${NPM_LAUNCH} default`)
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
