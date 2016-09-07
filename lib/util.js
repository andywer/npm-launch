'use strict'

const execa = require('execa')
const Observable = require('zen-observable')

/**
 * @param {string} command
 * @return {Promise<{ stdout: string, stderr: string }>}
 */
function shell (command) {
  return execa.shell(command)
}

/**
 * @param {string} command
 * @return {Observable<string>}
 *    Notifies its subscribers constantly about the lastest line of stdout/stderr output.
 */
function shellObservable (command) {
  const promisifiedProcess = execa.shell(command)

  return new Observable((observer) => {
    promisifiedProcess
      .then(() => observer.complete())
      .catch((error) => observer.error(error))

    if (promisifiedProcess.stdout) {
      observeStream(promisifiedProcess.stdout, (mostRecentLine) => observer.next(mostRecentLine))
    }
    if (promisifiedProcess.stderr) {
      observeStream(promisifiedProcess.stderr, (mostRecentLine) => observer.next(mostRecentLine))
    }
  })
}

/**
 * @param {Stream} stream
 * @param {function} onNewLine    function (mostRecentLine: string)
 * @return void
 */
function observeStream (stream, onNewLine) {
  stream.on('data', (text) => {
    if (typeof text !== 'string') {
      return
    }

    const mostRecentLine = text.split('\n').filter((line) => line.length > 0).pop()
    onNewLine(mostRecentLine)
  })
}

exports.shell = shell
exports.shellObservable = shellObservable
