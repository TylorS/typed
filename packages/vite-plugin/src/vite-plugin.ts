import { existsSync } from 'fs'
import { basename, join, relative, resolve } from 'path'

import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import glob from 'fast-glob'
import { visualizer } from 'rollup-plugin-visualizer'
import vavite from 'vavite'
import type { ConfigEnv, Plugin, PluginOption, UserConfig } from 'vite'
import compression from 'vite-plugin-compression'
import tsconfigPaths from 'vite-tsconfig-paths'

import { PLUGIN_NAME } from './constants.js'
import { ResolvedOptions } from './resolveTypedConfig.js'

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
  // let devServer: ViteDevServer
  // let isSsr = false

  const plugins: PluginOption[] = [
    tsconfigPaths({
      projects: [options.tsConfig],
    }) as PluginOption,
    visualizer({
      emitFile: true,
      filename: 'bundle-visualizer.html',
    }),
    ...pipe(
      options.serverFilePath,
      Option.filter(() => !options.isStaticBuild),
      Option.map((serverEntry) =>
        vavite({
          serverEntry,
          serveClientAssetsInDev: true,
        }),
      ),
      Option.toArray,
    ),
  ]

  const virtualModulePlugin: TypedVitePlugin = {
    name: PLUGIN_NAME,
    get resolvedOptions() {
      return options
    },
    /**
     * Configures our production build using vavite
     */
    config(config: UserConfig, env: ConfigEnv) {
      // isSsr = env.ssrBuild ?? false

      if (!config.root) {
        config.root = options.sourceDirectory
      }

      // Configure Build steps when running with vavite
      if (env.mode === 'multibuild') {
        const clientBuild: NonNullable<UserConfig['build']> = {
          outDir: options.clientOutputDirectory,
          rollupOptions: {
            input: buildClientInput(options.htmlFiles),
            external: ['happy-dom'],
          },
        }

        const clientConfig = {
          name: 'client',
          // @ts-expect-error Unable to resolve types properly for compression
          config: { build: clientBuild, plugins: [compression()] },
        }

        const serverConfig = pipe(
          options.serverFilePath,
          Option.map(
            (index): NonNullable<UserConfig['build']> => ({
              ssr: true,
              outDir: options.serverOutputDirectory,
              rollupOptions: {
                input: {
                  index,
                },
              },
            }),
          ),
          Option.map((build) => ({ name: 'server', config: { build, plugins: [] } })),
          Option.toArray,
        )

        // Hack to add support for build steps in vavite
        const multiBuildConfig = config as any

        // Append our build steps to the end of the build steps
        multiBuildConfig.buildSteps = (multiBuildConfig.buildSteps || []).concat(
          [clientConfig].concat(serverConfig),
        )
      }
    },

    /**
     * Updates our resolved options with the correct base path
     * and parses our input files for our manifest
     */
    configResolved(config) {
      // Ensure final options has the correct base path
      Object.assign(options, { base: config.base })
    },

    /**
     * Configures our dev server to watch for changes to our input files
     * and exposes the dev server to our compiler methods
     */
    // configureServer(server) {
    //   devServer = server
    // },

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
    async resolveId(id: string) {
      if (id === 'typed:config') {
        return id
      }

      return null
    },

    /**
     * Load our virtual modules
     */
    load(id: string) {
      if (id === 'typed:config') {
        return Object.entries(options).reduce((acc, [key, value]) => {
          acc += `export const ${key} = ${JSON.stringify(value)}\n`
          return acc
        }, '')
      }

      return null
    },

    /**
     * Transorm TypeScript modules
     */
    // transform(text: string, id: string) {
    //   return getCompiler().transpileTsModule(text, id, devServer)
    // },

    /**
     * Transform HTML files
     */
    // transformIndexHtml(html: string) {
    //   return getCompiler().transformHtml(html)
    // },
  }

  plugins.push(virtualModulePlugin)

  return plugins
}

export function resolveOptions({
  sourceDirectory: directory = cwd,
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

export function findHtmlFiles(
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

export function buildClientInput(htmlFilePaths: readonly string[]) {
  return htmlFilePaths.reduce(
    (acc, htmlFilePath) => ({ ...acc, [basename(htmlFilePath, '.html')]: htmlFilePath }),
    {},
  )
}

function getRelativePath(from: string, to: string) {
  const path = relative(from, to)

  if (path.startsWith('.')) {
    return path
  }

  return './' + path
}
