# npm-launch

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![NPM Version](https://img.shields.io/npm/v/npm-launch.svg)](https://www.npmjs.com/package/npm-launch)

Minimalistic task runner on steroids. Write scripts using JSON5 or ES6 JavaScript modules.

<p align="center">
  <img alt="Screencast" src="./doc/npm-launch.gif?raw=true" />
</p>

- Small, fast, supports JSON5 and JS code
- Runs locally installed commands from `node_modules/.bin` like package.json scripts
- Uses [Listr](https://github.com/SamVerschueren/listr) to provide beautiful console output
- Runs on node.js 4+

JSON5:
- Nicer syntax and comments possible

JavaScript:
- Completely transparent API: Just write your methods or CLI command lines
- ES6 module syntax is available out-of-the-box
- `async`/`await` are available out-of-the-box


## Installation

```sh
npm i --save-dev npm-launch
```


## Usage (JSON)

```js
// File: launch.scripts.json5
{
  build: "webpack -c webpack-config.production.js",
  test:  "run lint && run mocha",

  //////////
  // Hooks:

  prepush: "run build && run test",

  //////////////////
  // Testing tasks:

  lint:  "standard lib/**/*.js",
  mocha: "mocha"
}
```

```sh
$ launch build test     # run tasks "build" and "test"
# or
$ launch -f path/to/launch-file build test
```


## Usage (ES6 module)

```js
// File: launch.scripts.js

const shell = module.parent.exports.shell
const delay = 1500

// Define a task "npmPruneList"
export async function npmPruneList () {
  // Execute `npm prune`
  await shell('npm prune')
  // Then execute `npm list`
  await shell('npm list')
}

// Define a task "wasteSomeTime"
export function wasteSomeTime () {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay)
  })
}

// Define a task "default" that will just run "npmPruneList" & "wasteSomeTime" sequentially
export default [ npmPruneList, wasteSomeTime ]
```


## Tips

- If you do not provide a filename for a launch file it will look for a file named `launch.scripts.js`/`launch.scripts.json`/`launch.scripts.json5`
- Auto-camelcasing: Instead of `$ launch myTask` you can also run `$ launch my-task`


## Minor known limitations

#### No checkmark list for tasks being called by code

Tasks called by code are tracked and displayed, but not as a checkmark list,
but just as a hint which one is currently run. It's simple: In this case we
cannot create a list of subtasks beforehand, since there is no way to know
which sub-tasks the function is going to call.

#### console.log() in tasks may disturb the output

If you call `console.log()` (or similar) in your launch file then the checkmark
list will probably be corrupted.


## License

This library is released under the terms of the MIT license. See [LICENSE](./LICENSE) for details.
