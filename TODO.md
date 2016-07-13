# TODO

- CLI option to not use Listr and write all console output to terminal (--debug or similar)
- Come up with some way to let tasks print a tail of n lines to terminal when all is done
  (Maybe just parse `| tail -n <lines>` at the end of commands)
- Write unit tests!
- Implement a way to run stuff in parallel in JSON
-
- Show full stack traces on errors thrown by npm-launch itself only if a `verbose` flag is set
- Run JS code in sub process to prevent stdout/stderr to be written to unfiltered (breaks Listr output)
- Maybe: Allow methods to return an array of task names to execute
