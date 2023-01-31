import { cac } from 'cac'

// Not technically in the project root in the tsconfig, but relatively
// the same path from the output directory.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pkg from '../package.json' assert { 'type': 'json' }

import { build } from './command/build.js'
import { preview } from './command/preview.js'
import { run } from './command/run.js'
import { serve } from './command/serve.js'

// Take information for the current process
const cwd = process.cwd()

// Create our cli
const cli = cac('typed').version(pkg.version).help()

// Register our commands
serve(cli, cwd)
build(cli, cwd)
run(cli, cwd)
preview(cli, cwd)

// Parse the cli
cli.parse()
