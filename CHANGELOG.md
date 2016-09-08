# npm-launch - Changelog

This is the brief changelog. For more details see https://github.com/andywer/npm-launch/releases.

## v0.3.0

- Show last (non-empty) line of command output: npm-launch/issues#5
- Minor fix: Prevent unhelpful stack trace: npm-launch/issues#6
- Minor fix: Set process title to `npm-launch` (defaulted to `node` until now)
- Minor fix: Add `engines` prop to `package.json`

## v0.2.0

- Support for running tasks concurrently using `run-p`/`run-parallel`

## v0.1.4

- CLI option: `--list`

## v0.1.3

- Bug fix: Babel transformation fix (concerns JS launch files only, not JSON)

## v0.1.2

- Add unit and functional tests
- Bug fix: Exit with status code 1 if there is an error

## v0.1.1

- Show the currently run shell command for JSON tasks

## v0.1.0

- Initial release. Yeah!
- Supports JSON5 and ES6 modules
- Uses Listr
