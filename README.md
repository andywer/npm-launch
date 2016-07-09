# npm-launch

Write scripts using JSON5 or just exporting some JavaScript functions.

(Usage: tasks.js)
(Usage: GIF: Run on CLI)

- Small, fast, supports JS code, JSON & JSON5 (JSON with nicer syntax and comments)
- Runs commands from local `node_modules/.bin` like npm scripts do
- Completely transparent API: Just write your methods or CLI command lines
- JS: async/await are available out-of-the-box
- JS: ES6 modules are available out-of-the-box
- Uses [Listr](https://github.com/SamVerschueren/listr) to provide beautiful console output
- Runs on node.js 4+

(No API. Just exporting functions: One function equals one task.)


## Installation

```sh
npm i --save-dev npm-launch
```


## Usage (JSON)

```js
// File: tasks.json5
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
$ launch -f path/to/tasks-file build test
```


## Usage (JS code)

```js
// File: tasks.js

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

- If you do not provide a filename for a tasks file it will look for a file named `tasks.js`/`tasks.json`/`tasks.json5`
- Auto-camelcasing: Instead of `$ launch myTask` you can also run `$ launch my-task`


## Known limitations

#### No checkmark list for tasks being called by code

Tasks called by code are tracked and displayed, but not as a checkmark list,
but just as a hint which one is currently run. It's simple: In this case we
cannot create a list of subtasks beforehand, since there is no way to know
which sub-tasks the function is going to call.

#### console.log() in tasks may disturb the output

If you call `console.log()` (or similar) in your tasks file then the checkmark
list will probably be corrupted.


## License

This library is released under the terms of the MIT license. See [LICENSE](./LICENSE) for details.
