import { EOL } from 'os'

import colors from 'picocolors'
import { createServer, type ServerOptions } from 'vite'

import type { ViteCliOptions } from './ViteCliOptions.js'
import { attemptToFindViteConfig, cleanOptions, filterDuplicateOptions } from './helpers.js'

export type ServeOptions = ServerOptions & ViteCliOptions

export interface ServeEnv {
  readonly cwd: string
}

export const runDevServer = async (options: ServeOptions, env: ServeEnv) => {
  filterDuplicateOptions(options)

  try {
    const server = await createServer({
      base: options.base,
      mode: options.mode,
      configFile: options.config ?? attemptToFindViteConfig(env.cwd),
      logLevel: options.logLevel,
      clearScreen: options.clearScreen,
      optimizeDeps: { force: options.force },
      server: cleanOptions(options),
    })

    if (!server.httpServer) {
      throw new Error('HTTP server not available')
    }

    await server.listen()

    const viteStartTime = (global as any).__vite_start_time ?? false
    const startupDurationString = viteStartTime
      ? colors.dim(
          `ready in ${colors.reset(colors.bold(Math.ceil(performance.now() - viteStartTime)))} ms`,
        )
      : ''

    server.config.logger.info(
      `${EOL}  ${colors.green(`${colors.bold('typed')}`)}  ${startupDurationString}${EOL}`,
      {
        clear: !server.config.logger.hasWarned,
      },
    )

    server.printUrls()
  } catch (e) {
    console.error(colors.red(`error when starting dev server:${EOL}${e}`))
    process.exit(1)
  }
}
