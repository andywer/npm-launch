# Task runner

Write scripts/makefiles by just exporting some JavaScript functions or JSON5.

(Usage: tasks.js)
(Usage: GIF: Run on CLI)

- Small, fast, supports JS code, JSON & JSON5
- Runs commands from local `node_modules/.bin` like npm scripts do
- Completely transparent API: Just write your methods or CLI command lines
- JS: async/await are available out-of-the-box
- JS: ES6 modules are available out-of-the-box
- Uses [Listr](https://github.com/SamVerschueren/listr) to provide beautiful console output
- Runs on node.js 4+

(No API. Just exporting functions: One function equals one task.)


## Installation


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
