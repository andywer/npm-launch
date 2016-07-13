'use strict'

const execa = require('execa')

function shell (command) {
  return execa.shell(command)
}

exports.shell = shell
