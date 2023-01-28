import { existsSync } from 'fs'
import { homedir } from 'os'
import { dirname, resolve } from 'path'

// @ts-expect-error Unable to find types
import multibuild from '@vavite/multibuild'
import { cac, Command } from 'cac'
import colors from 'picocolors'
import { createServer, type LogLevel, type ResolvedConfig, type ServerOptions } from 'vite'
import type { ViteNodeServerOptions } from 'vite-node'
import { ViteNodeRunner } from 'vite-node/client'
import { createHotContext, handleMessage, viteNodeHmrPlugin } from 'vite-node/hmr'
import { ViteNodeServer } from 'vite-node/server'
import { installSourcemapsSupport } from 'vite-node/source-map'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pkg from '../package.json' assert { 'type': 'json' }

const cwd = process.cwd()

const cli = cac('typed')

cli.version(pkg.version).help()

const addCliOptions = (cli: Command) =>
  cli
    .option('-c, --config <file>', `[string] use specified vite config file`)
    .option('--base <path>', `[string] public base path (default: /)`)
    .option('-l, --logLevel <level>', `[string] info | warn | error | silent`)
    .option('--clearScreen', `[boolean] allow/disable clear screen when logging`)
    .option('-d, --debug [feat]', `[string | boolean] show debug logs`)
    .option('-f, --filter <filter>', `[string] filter debug logs`)
    .option('-m, --mode <mode>', `[string] set env mode`)

export interface CliOptions {
  '--'?: string[]
  c?: boolean | string
  config?: string
  base?: string
  l?: LogLevel
  logLevel?: LogLevel
  clearScreen?: boolean
  d?: boolean | string
  debug?: boolean | string
  f?: string
  filter?: string
  m?: string
  mode?: string
  force?: boolean
}

/**
 * Run vite dev server
 */
addCliOptions(cli.command('<directory>', 'Serve your project'))
  .alias('serve')
  .option('--host [host]', `[string] specify hostname`)
  .option('--port <port>', `[number] specify port`)
  .option('--https', `[boolean] use TLS + HTTP/2`)
  .option('--open [path]', `[boolean | string] open browser on startup`)
  .option('--cors', `[boolean] enable CORS`)
  .option('--strictPort', `[boolean] exit if specified port is already in use`)
  .option('--force', `[boolean] force the optimizer to ignore the cache and re-bundle`)
  .action(async (root: string, options: ServerOptions & CliOptions) => {
    filterDuplicateOptions(options)

    try {
      const server = await createServer({
        root,
        base: options.base,
        mode: options.mode,
        configFile: options.config ?? attemptToFindViteConfig(resolve(cwd, root)),
        logLevel: options.logLevel,
        clearScreen: options.clearScreen,
        optimizeDeps: { force: options.force },
        server: cleanOptions(options),
      })

      if (!server.httpServer) {
        throw new Error('HTTP server not available')
      }

      await server.listen()

      const info = server.config.logger.info

      const viteStartTime = (global as any).__vite_start_time ?? false
      const startupDurationString = viteStartTime
        ? colors.dim(
            `ready in ${colors.reset(
              colors.bold(Math.ceil(performance.now() - viteStartTime)),
            )} ms`,
          )
        : ''

      info(`\n  ${colors.green(`${colors.bold('VITE')}`)}  ${startupDurationString}\n`, {
        clear: !server.config.logger.hasWarned,
      })

      server.printUrls()
    } catch (e) {
      console.error(colors.red(`error when starting dev server:\n${e}`))
      process.exit(1)
    }
  })

export interface RunCliOptions {
  root?: string
  config?: string
  watch?: boolean
  options?: ViteNodeServerOptionsCLI
  static?: boolean
  '--'?: string[]
}

type Optional<T> = T | undefined
type ComputeViteNodeServerOptionsCLI<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Optional<RegExp[]>
    ? string | string[]
    : T[K] extends Optional<(string | RegExp)[]>
    ? string | string[]
    : T[K] extends Optional<(string | RegExp)[] | true>
    ? string | string[] | true
    : T[K] extends Optional<Record<string, any>>
    ? ComputeViteNodeServerOptionsCLI<T[K]>
    : T[K]
}

export type ViteNodeServerOptionsCLI = ComputeViteNodeServerOptionsCLI<ViteNodeServerOptions>

/**
 * Run a file with vite-node
 */
cli
  .command('run [...files]', 'Build your project')
  .option('-r, --root <path>', 'Use specified root directory')
  .option('-c, --config <path>', 'Use specified config file')
  .option('-w, --watch', 'Restart on file changes, similar to "nodemon"')
  .option('-s, --static', 'Set static build flag for @typed/vite-plugin')
  .option('--options <options>', 'Use specified Vite server options')
  .action(runFiles)

async function runFiles(files: string[], options: RunCliOptions) {
  if (!files.length) {
    console.error(colors.red('No files specified.'))
    cli.outputHelp()
    process.exit(1)
  }

  const isStaticBuild = options.static ?? false

  if (isStaticBuild) {
    // set static build flag
    process.env.STATIC_BUILD = 'true'
  }

  const serverOptions = parseViteNodeServerOptions(options.options ?? {}, isStaticBuild)

  // Foward argv
  process.argv = process.argv.slice(0, 2).concat(options['--'] ?? [])

  const server = await createServer({
    logLevel: 'error',
    ...(isStaticBuild ? { mode: 'production' } : {}),
    root: options.root,
    configFile: options.config ?? attemptToFindViteConfig(resolve(cwd, options.root ?? '.')),
    plugins: [options.watch && viteNodeHmrPlugin()],
  })

  await server.pluginContainer.buildStart({})

  const node = new ViteNodeServer(server, serverOptions)

  installSourcemapsSupport({
    getSourceMap: (source) => node.getSourceMap(source),
  })

  const runner = new ViteNodeRunner({
    root: server.config.root,
    base: server.config.base,
    fetchModule(id) {
      return node.fetchModule(id)
    },
    resolveId(id, importer) {
      return node.resolveId(id, importer)
    },
    createHotContext(runner, url) {
      return createHotContext(runner, server.emitter, files, url)
    },
  })

  // provide the vite define variable in this context
  await runner.executeId('/@vite/env')

  for (const file of files) await runner.executeFile(resolve(process.cwd(), file))

  if (!options.watch) await server.close()

  server.emitter?.on('message', (payload) => handleMessage(runner, server.emitter, files, payload))

  if (options.watch) {
    process.on('uncaughtException', (err) => {
      console.error(colors.red('Failed to execute file: \n'), err)
    })
  }
}

export interface BuildOptions extends CliOptions {
  c?: boolean | string
  base?: string
  l?: LogLevel
  logLevel?: LogLevel
  clearScreen?: boolean
  d?: boolean | string
  debug?: boolean | string
  f?: string
  filter?: string
  m?: string
  mode?: string
  s?: string
  static?: string
  options?: ViteNodeServerOptionsCLI
}

/**
 * Runs vavite multibuild to trigger @typed/vite-plugin to build all of our entries.
 */
addCliOptions(cli.command('build [directory]', 'Build your project as static files'))
  .option('--target <target>', `[string] transpile target (default: 'modules')`)
  .option('--outDir <dir>', `[string] output directory (default: dist)`)
  .option(
    '--assetsDir <dir>',
    `[string] directory under outDir to place assets in (default: _assets)`,
  )
  .option(
    '--assetsInlineLimit <number>',
    `[number] static asset base64 inline threshold in bytes (default: 4096)`,
  )
  .option('--ssr [entry]', `[string] build specified entry for server-side rendering`)
  .option('--sourcemap', `[boolean] output source maps for build (default: false)`)
  .option(
    '--minify [minifier]',
    `[boolean | "terser" | "esbuild"] enable/disable minification, ` +
      `or specify minifier to use (default: esbuild)`,
  )
  .option('--manifest', `[boolean] emit build manifest json`)
  .option('--ssrManifest', `[boolean] emit ssr manifest json`)
  .option('--emptyOutDir', `[boolean] force empty outDir when it's outside of root`)
  .option('-w, --watch', `[boolean] rebuilds when modules have changed on disk`)
  .option('-s, --static [file]', `[string] run a static build with the specified entry file`)
  .option('--options <options>', 'Use specified Vite server options for static builds')
  .action(async (root: string, options: BuildOptions) => {
    const buildOptions: BuildOptions = cleanOptions(options)

    let initialConfig: ResolvedConfig

    process.env.NODE_ENV = options.mode || 'production'

    await multibuild(
      {
        root,
        base: options.base,
        configFile: options.config ?? attemptToFindViteConfig(resolve(cwd, root)),
        logLevel: options.logLevel,
        clearScreen: options.clearScreen,
        build: buildOptions,
      },
      {
        onInitialConfigResolved(config: ResolvedConfig) {
          initialConfig = config
        },

        onStartBuildStep(info: any) {
          if (!info.currentStep) return

          initialConfig.logger.info(
            (info.currentStepIndex ? '\n' : '') +
              colors.cyan('vavite: ') +
              colors.white('running build step') +
              ' ' +
              colors.blue(info.currentStep.name) +
              ' (' +
              colors.green(info.currentStepIndex + 1 + '/' + info.buildSteps.length) +
              ')',
          )
        },
      },
    )

    if (options.static) {
      await runFiles([options.static], {
        root,
        config: options.config,
        options: options.options,
        static: true,
      })
    }
  })

cli.parse()

function cleanOptions<Options extends BuildOptions>(
  options: Options,
): Omit<Options, keyof BuildOptions> {
  const ret = { ...options }
  delete ret['--']
  delete ret.c
  delete ret.config
  delete ret.base
  delete ret.l
  delete ret.logLevel
  delete ret.clearScreen
  delete ret.d
  delete ret.debug
  delete ret.f
  delete ret.filter
  delete ret.m
  delete ret.mode
  return ret
}

function filterDuplicateOptions<T extends object>(options: T) {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1]
    }
  }
}

function parseViteNodeServerOptions(
  serverOptions: ViteNodeServerOptionsCLI,
  staticBuild: boolean,
): ViteNodeServerOptions {
  const inlineOptions =
    serverOptions.deps?.inline === true ? true : toArray(serverOptions.deps?.inline)

  return {
    ...serverOptions,
    deps: {
      ...serverOptions.deps,
      inline:
        inlineOptions !== true
          ? inlineOptions.map((dep) => {
              return dep.startsWith('/') && dep.endsWith('/') ? new RegExp(dep) : dep
            })
          : true,
      external: toArray(serverOptions.deps?.external).map((dep) => {
        return dep.startsWith('/') && dep.endsWith('/') ? new RegExp(dep) : dep
      }),
    },

    transformMode: {
      ...serverOptions.transformMode,
      ssr: [
        ...(staticBuild ? [new RegExp('.svelte')] : []),
        ...toArray(serverOptions.transformMode?.ssr).map((dep) => new RegExp(dep)),
      ],
      web: toArray(serverOptions.transformMode?.web).map((dep) => new RegExp(dep)),
    },
  }
}

function toArray<T>(value: T | T[] | undefined): T[] {
  return value ? (Array.isArray(value) ? value : [value]) : []
}

function attemptToFindViteConfig(root: string): string | undefined {
  if (root === homedir()) {
    return undefined
  }

  const tsConfigPath = resolve(root, 'vite.config.ts')
  if (existsSync(tsConfigPath)) {
    return tsConfigPath
  }

  const jsConfigPath = resolve(root, 'vite.config.js')
  if (existsSync(jsConfigPath)) {
    return jsConfigPath
  }

  const cjsConfigPath = resolve(root, 'vite.config.cjs')
  if (existsSync(cjsConfigPath)) {
    return cjsConfigPath
  }

  const mjsConfigPath = resolve(root, 'vite.config.mjs')
  if (existsSync(mjsConfigPath)) {
    return mjsConfigPath
  }

  return attemptToFindViteConfig(dirname(root))
}
