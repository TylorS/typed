import { resolve } from 'path'

import colors from 'picocolors'
import { createServer } from 'vite'
import type { ViteNodeServerOptions } from 'vite-node'
import { ViteNodeRunner } from 'vite-node/client'
import { createHotContext, handleMessage, viteNodeHmrPlugin } from 'vite-node/hmr'
import { ViteNodeServer } from 'vite-node/server'
import { installSourcemapsSupport } from 'vite-node/source-map'

import { attemptToFindViteConfig, parseViteNodeServerOptions } from './helpers.js'

export interface RunViteNodeOptions {
  root?: string
  config?: string
  watch?: boolean
  options?: ViteNodeServerOptionsCLI
  static?: boolean
  '--'?: string[]
}

export type ViteNodeServerOptionsCLI = ComputeViteNodeServerOptionsCLI<ViteNodeServerOptions>

type Optional<T> = T | undefined
type ComputeViteNodeServerOptionsCLI<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Optional<RegExp[]>
    ? string[]
    : T[K] extends Optional<(string | RegExp)[]>
    ? string[]
    : T[K] extends Optional<(string | RegExp)[] | true>
    ? string[] | true
    : T[K] extends Optional<Record<string, any>>
    ? ComputeViteNodeServerOptionsCLI<T[K]>
    : T[K]
}

export interface RunViteNodeEnv {
  readonly cwd: string
  readonly outputHelp: () => void
}

export async function runViteNode(
  files: string[],
  options: RunViteNodeOptions,
  env: RunViteNodeEnv,
) {
  if (!files.length) {
    console.error(colors.red('No files specified.'))
    env.outputHelp()
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
    configFile: options.config ?? attemptToFindViteConfig(resolve(env.cwd, options.root ?? '.')),
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
