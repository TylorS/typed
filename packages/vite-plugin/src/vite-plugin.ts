import { existsSync, writeFileSync } from 'fs'
import { EOL } from 'os'
import { basename, join, resolve } from 'path'

import { pipe } from '@fp-ts/core/Function'
import * as Option from '@fp-ts/core/Option'
import { Compiler, getRelativePath, type ResolvedOptions } from '@typed/compiler'
import glob from 'fast-glob'
// @ts-expect-error Unable to resolve types w/ NodeNext
import vavite from 'vavite'
import type { ConfigEnv, Plugin, PluginOption, UserConfig, ViteDevServer } from 'vite'
import compression from 'vite-plugin-compression'
import tsconfigPaths from 'vite-tsconfig-paths'

import { PLUGIN_NAME } from './constants.js'

/**
 * The Configuration for the Typed Plugin. All file paths can be relative to sourceDirectory or
 * can be absolute, path.resolve is used to stitch things together.
 */
export interface PluginOptions {
  /**
   * The directory in which you have your application.
   * This can be relative to the current working directory or absolute.
   */
  readonly sourceDirectory: string

  /**
   * The file path to your tsconfig.json file.
   */
  readonly tsConfig?: string

  /**
   * The file path to your server entry file
   */
  readonly serverFilePath?: string

  /**
   * The output directory for your client code
   */
  readonly clientOutputDirectory?: string

  /**
   * The output directory for your server code
   */
  readonly serverOutputDirectory?: string

  /**
   * File globs to use to look for your HTML entry points.
   */
  readonly htmlFileGlobs?: readonly string[]

  /**
   * If true, will configure the effect-ts plugin to include debugger statements. If
   * effectTsOptions.debug is provided it will override this value.
   */
  readonly debug?: boolean

  /**
   * If true, will configure the plugin to save all the generated files to disk
   */
  readonly saveGeneratedModules?: boolean

  /**
   * If true, will configure the plugin to operate in a static build mode.
   */
  readonly isStaticBuild?: boolean
}

const cwd = process.cwd()

export interface TypedVitePlugin extends Plugin {
  readonly name: typeof PLUGIN_NAME
  readonly resolvedOptions: ResolvedOptions
}

export default function makePlugin(pluginOptions: PluginOptions): PluginOption[] {
  const options: ResolvedOptions = resolveOptions(pluginOptions)

  let compiler: Compiler
  let devServer: ViteDevServer
  let isSsr = false

  const plugins: PluginOption[] = [
    tsconfigPaths({
      projects: [options.tsConfig],
    }),
    pipe(
      options.serverFilePath,
      Option.filter(() => !options.isStaticBuild),
      Option.map((serverEntry) =>
        vavite({
          serverEntry,
          serveClientAssetsInDev: true,
        }),
      ),
      Option.getOrNull,
    ),
  ]

  const getCompiler = () => {
    if (compiler) {
      return compiler
    }

    return (compiler = new Compiler(PLUGIN_NAME, options))
  }

  const virtualModulePlugin: TypedVitePlugin = {
    name: PLUGIN_NAME,
    resolvedOptions: options,

    /**
     * Configures our production build using vavite
     */
    config(config: UserConfig, env: ConfigEnv) {
      isSsr = env.ssrBuild ?? false

      // Configure Build steps when running with vavite
      if (env.mode === 'multibuild') {
        const clientBuild: UserConfig['build'] = {
          outDir: options.clientOutputDirectory,
          rollupOptions: {
            input: buildClientInput(options.htmlFiles),
          },
        }

        const serverBuild = pipe(
          options.serverFilePath,
          Option.map((index): UserConfig['build'] => ({
            ssr: true,
            outDir: options.serverOutputDirectory,
            rollupOptions: {
              input: {
                index,
              },
            },
          })),
          Option.getOrNull,
        )

        ;(config as any).buildSteps = [
          {
            name: 'client',
            // @ts-expect-error Unable to resolve types w/ NodeNext
            config: { build: clientBuild, plugins: [compression()] },
          },
          serverBuild,
        ]

        return
      }
    },

    /**
     * Updates our resolved options with the correct base path
     * and parses our input files for our manifest
     */
    configResolved(resolvedConfig) {
      // Ensure options have the correct base path
      Object.assign(options, { base: resolvedConfig.base })

      getCompiler().parseInput(resolvedConfig.build.rollupOptions.input)
    },

    /**
     * Configures our dev server to watch for changes to our input files
     * and exposes the dev server to our compiler methods
     */
    configureServer(server) {
      devServer = server

      server.watcher.on('all', (event, path) => {
        if (event === 'change') {
          getCompiler().handleFileChange(path, 'update', server)
        } else if (event === 'add') {
          getCompiler().handleFileChange(path, 'create', server)
        } else if (event === 'unlink') {
          getCompiler().handleFileChange(path, 'delete', server)
        }
      })
    },

    /**
     * Handles file changes
     */
    async watchChange(path, { event }) {
      getCompiler().handleFileChange(path, event, devServer)
    },

    /**
     * Type-check our project and fail the build if there are any errors.
     * If successful, save our manifest to disk.
     */
    async closeBundle() {
      const { manifest, throwDiagnostics } = getCompiler()

      // Throw any diagnostics that were collected during the build
      throwDiagnostics()

      if (Object.keys(manifest).length > 0 && !options.isStaticBuild) {
        writeFileSync(
          resolve(
            isSsr ? options.serverOutputDirectory : options.clientOutputDirectory,
            'typed-manifest.json',
          ),
          JSON.stringify(manifest, null, 2) + EOL,
        )
      }
    },

    /**
     * Resolve and build our virtual modules
     */
    async resolveId(id: string, importer?: string) {
      return await getCompiler().resolveId(id, importer, devServer)
    },

    /**
     * Load our virtual modules
     */
    async load(id: string) {
      return await getCompiler().load(id)
    },

    /**
     * Transorm TypeScript modules
     */
    transform(text: string, id: string) {
      return getCompiler().transpileTsModule(text, id, devServer)
    },

    /**
     * Transform HTML files
     */
    transformIndexHtml(html: string) {
      return getCompiler().transformHtml(html)
    },
  }

  plugins.push(virtualModulePlugin)

  return plugins
}

function resolveOptions({
  sourceDirectory: directory,
  tsConfig,
  serverFilePath,
  clientOutputDirectory,
  serverOutputDirectory,
  htmlFileGlobs,
  debug = false,
  saveGeneratedModules = false,
  isStaticBuild = process.env.STATIC_BUILD === 'true',
}: PluginOptions): ResolvedOptions {
  // Resolved options
  const sourceDirectory = resolve(cwd, directory)
  const tsConfigFilePath = resolve(sourceDirectory, tsConfig ?? 'tsconfig.json')
  const resolvedServerFilePath = resolve(sourceDirectory, serverFilePath ?? 'server.ts')
  const serverExists = existsSync(resolvedServerFilePath)
  const resolvedServerOutputDirectory = resolve(
    sourceDirectory,
    serverOutputDirectory ?? 'dist/server',
  )
  const resolvedClientOutputDirectory = resolve(
    sourceDirectory,
    clientOutputDirectory ?? 'dist/client',
  )

  const exclusions = [
    getRelativePath(sourceDirectory, join(resolvedServerOutputDirectory, '/**/*')),
    getRelativePath(sourceDirectory, join(resolvedClientOutputDirectory, '/**/*')),
    '**/node_modules/**',
  ]

  const resolvedOptions: ResolvedOptions = {
    base: '/',
    clientOutputDirectory: resolvedClientOutputDirectory,
    debug,
    exclusions,
    htmlFiles: findHtmlFiles(sourceDirectory, htmlFileGlobs, exclusions).map((p) =>
      resolve(sourceDirectory, p),
    ),
    isStaticBuild,
    saveGeneratedModules,
    serverFilePath: serverExists ? Option.some(resolvedServerFilePath) : Option.none(),
    serverOutputDirectory: resolvedServerOutputDirectory,
    sourceDirectory,
    tsConfig: tsConfigFilePath,
  }

  return resolvedOptions
}

function findHtmlFiles(
  directory: string,
  htmlFileGlobs: readonly string[] | undefined,
  exclusions: readonly string[],
): readonly string[] {
  if (htmlFileGlobs) {
    // eslint-disable-next-line import/no-named-as-default-member
    return glob.sync([...htmlFileGlobs, ...exclusions.map((x) => '!' + x)], { cwd: directory })
  }

  // eslint-disable-next-line import/no-named-as-default-member
  return glob.sync(['**/*.html', ...exclusions.map((x) => '!' + x)], {
    cwd: directory,
  })
}

function buildClientInput(htmlFilePaths: readonly string[]) {
  return htmlFilePaths.reduce(
    (acc, htmlFilePath) => ({ ...acc, [basename(htmlFilePath, '.html')]: htmlFilePath }),
    {},
  )
}
