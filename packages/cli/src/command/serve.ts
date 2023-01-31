import type { CAC } from 'cac'

import { addViteCliOptions } from '../ViteCliOptions.js'
import { type ServeOptions, runDevServer } from '../runDevServer.js'

/**
 * Run vite dev server
 */
export const serve = (cli: CAC, cwd: string) =>
  addViteCliOptions(cli.command('serve', 'Serve your project'))
    .alias('')
    .option('--host [host]', `[string] specify hostname`)
    .option('--port <port>', `[number] specify port`)
    .option('--https', `[boolean] use TLS + HTTP/2`)
    .option('--open [path]', `[boolean | string] open browser on startup`)
    .option('--cors', `[boolean] enable CORS`)
    .option('--strictPort', `[boolean] exit if specified port is already in use`)
    .option('--force', `[boolean] force the optimizer to ignore the cache and re-bundle`)
    .action((options: ServeOptions) => runDevServer(options, { cwd }))
