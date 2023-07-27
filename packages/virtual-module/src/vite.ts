import { promises } from 'fs'
import { relative, resolve } from 'path'

import ts from 'typescript'
// @ts-expect-error -- Vite types don't work in a CJS environment
import type { ConfigEnv, Plugin, PluginOption, UserConfig, ViteDevServer } from 'vite'

import { ProductionParams } from './VirtualModulePlugin'
import * as VM from './api.js'
import { Service } from './service'

const PLUGIN_NAME = '@typed/virtual-module'
const VIRTUAL_PREFIX = '\0'

/**
 * The Configuration for the Typed Plugin. All file paths can be relative to sourceDirectory or
 * can be absolute, path.resolve is used to stitch things together.
 */
export interface PluginOptions {
  /**
   * The directory in which you have your application.
   * This can be relative to the current working directory or absolute.
   */
  readonly sourceDirectory?: string

  /**
   * The file path to your tsconfig.json file.
   */
  readonly tsConfig?: string

  /**
   * The output directory for your client code
   */
  readonly clientOutputDirectory?: string

  /**
   * The output directory for your server code
   */
  readonly serverOutputDirectory?: string

  /**
   * If true, will configure the plugin to save all the generated files to disk
   */
  readonly saveGeneratedModules?: boolean

  /**
   * The environment we're building for. Defaults to browser.
   */
  readonly environment?: 'static' | 'server' | 'browser'
}

const cwd = process.cwd()

export interface VirtualModuleVitePlugin extends Plugin {
  readonly name: typeof PLUGIN_NAME
  readonly resolvedOptions: ProductionParams
}

// TODO: Manage file-watchers
//

export function virtualModulePlugin(pluginOptions: PluginOptions): PluginOption[] {
  const options: ProductionParams = resolveProductionParams(pluginOptions)
  const tsConfigFilePath = VM.findConfigFile(options.sourceDirectory, pluginOptions.tsConfig)

  if (!tsConfigFilePath) {
    throw new Error(`Could not find tsconfig.json file in ${options.sourceDirectory}`)
  }

  const tsConfig = VM.readConfigFile(tsConfigFilePath)

  if (!tsConfig) {
    throw new Error(`Could not read tsconfig.json file in ${options.sourceDirectory}`)
  }

  const typedOptions = VM.resolveTypedOptions(tsConfig.raw)
  const typedPlugins = typedOptions.plugins.map(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    (plugin) => require(plugin.name) as VM.VirtualModulePlugin<any>,
  )
  const typedPluginParams = Object.fromEntries(
    typedOptions.plugins.map(({ name, ...config }) => [name, config] as const),
  )

  const service = new Service()
  const project = service.openProject(tsConfig)

  const manager = new VM.VirtualModuleManager(
    typedPlugins,
    typedPluginParams,
    () => project.languageService,
    (msg) => console.log(`[@typed/virtual] ${msg}`),
  )

  // Patch the language service host to use our virtual module manager
  VM.patchLanguageServiceHost({
    cmdLine: tsConfig,
    host: project.languageServiceHost,
    manager,
    workingDirectory: process.cwd(),
    saveGeneratedFiles: typedOptions.saveGeneratedFiles ?? false,
    options: tsConfig.options,
  })

  let devServer: ViteDevServer
  let isProduction = false

  const plugins: PluginOption[] = []

  const virtualModulePlugin: VirtualModuleVitePlugin = {
    name: PLUGIN_NAME,
    get resolvedOptions() {
      return options
    },
    /**
     * Configures our production build using vavite
     */
    config(config: UserConfig, env: ConfigEnv) {
      isProduction = env.command === 'build'

      if (!config.root) {
        config.root = options.sourceDirectory
      }
    },

    /**
     * Updates our resolved options with the correct base path + asset directory
     * and parses our input files for our manifest
     */
    configResolved(config) {
      // Ensure final options has the correct base path and asset directory
      Object.assign(options, { base: config.base, assetDirectory: config.build.assetsDir })
    },

    /**
     * Configures our dev server to watch for changes to our input files
     * and exposes the dev server to our compiler methods
     */
    configureServer(server) {
      devServer = server
    },

    /**
     * Handles file changes
     */
    // async watchChange(path, { event }) {},

    /**
     * Type-check our project and fail the build if there are any errors.
     * If successful, save our manifest to disk.
     */
    // async closeBundle() {},

    /**
     * Resolve and build our virtual modules
     */
    async resolveId(id: string, importer?: string) {
      if (importer && manager.matches(id, importer)) {
        return VIRTUAL_PREFIX + manager.resolveFileName(id, importer)
      }

      return null
    },

    /**
     * Load our virtual modules
     */
    async load(id: string) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        const fileName = id.slice(VIRTUAL_PREFIX.length)
        const snapshot = isProduction
          ? await manager.generateProductionSnapshot(fileName, {
              ...options,
              transformHtml: (html) =>
                devServer.transformIndexHtml(relative(options.sourceDirectory, fileName), html),
            })
          : manager.generateSnapshot(fileName)

        const content = snapshot.getContent()

        if (typedOptions.saveGeneratedFiles) {
          await promises.writeFile(snapshot.fileName, content)
        }

        const output = ts.transpileModule(content, {
          compilerOptions: tsConfig.options,
        })

        if (output.diagnostics && output.diagnostics.length > 0) {
          // TODO: Print diagnostics
        }

        return {
          code: output.outputText,
          map: output.sourceMapText,
        }
      }

      return null
    },
  }

  plugins.push(virtualModulePlugin)

  return plugins
}

export function resolveProductionParams({
  sourceDirectory: directory = cwd,
  clientOutputDirectory,
  serverOutputDirectory,
  environment,
}: PluginOptions): ProductionParams {
  // Resolved options
  const sourceDirectory = resolve(cwd, directory)
  const resolvedServerOutputDirectory = resolve(
    sourceDirectory,
    serverOutputDirectory ?? 'dist/server',
  )
  const resolvedClientOutputDirectory = resolve(
    sourceDirectory,
    clientOutputDirectory ?? 'dist/client',
  )

  const resolvedOptions: ProductionParams = {
    base: '/',
    clientOutputDirectory: resolvedClientOutputDirectory,
    serverOutputDirectory: resolvedServerOutputDirectory,
    sourceDirectory,
    environment: environment ?? 'browser',
    assetDirectory: 'assets',
  }

  return resolvedOptions
}
