'use strict'

const npmRun = require('npm-run')

function shell (command) {
  return new Promise((resolve, reject) => {
    npmRun(command, {}, (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }
      resolve({ stdout, stderr })
    })
  })
}

exports.shell = shell
