# Debugging

## Source maps
This project's `tsc` compiler options automatically create source maps that should allow you to display TypeScript code instead of compiled JavaScript code when debugging. They will also let you set breakpoints directly within TypeScript files. For manual debugging my go-to configuration is running Node with `--inspect-brk` flag and then attaching to the debug session from within VSCode. A command `npm run mantest` is implemented for that in `package.json` file.

## Logger
This project uses `winston` logger as defined in the `utils.ts` file. To make this work properly set `LOG_SEVERITY` environment variable before running this project to one of the following strings:
* error
* warn
* info
* http
* verbose
* debug
* silly