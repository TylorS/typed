import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { basename, dirname, join, relative, resolve } from 'path'

import effectTransformer from '@effect/language-service/transformer'
import {
  setupTsProject,
  makeBrowserModule,
  makeHtmlModule,
  makeRuntimeModule,
  readDirectory,
  readModules,
} from '@typed/compiler'
import glob from 'fast-glob'
import { Project, SourceFile, ts, type CompilerOptions } from 'ts-morph'
// @ts-expect-error Unable to resolve types w/ NodeNext
import vavite from 'vavite'
import type { ConfigEnv, Plugin, PluginOption, UserConfig, ViteDevServer } from 'vite'
import compression from 'vite-plugin-compression'
import tsconfigPaths from 'vite-tsconfig-paths'

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
}

const cwd = process.cwd()

const PLUGIN_NAME = '@typed/vite-plugin'

const RUNTIME_VIRTUAL_ENTRYPOINT_PREFIX = 'runtime'
const BROWSER_VIRTUAL_ENTRYPOINT_PREFIX = 'browser'
const HTML_VIRTUAL_ENTRYPOINT_PREFIX = 'html'

const VIRTUAL_ID_PREFIX = '\0'

export default function makePlugin({
  sourceDirectory: directory,
  tsConfig,
  serverFilePath,
  clientOutputDirectory,
  serverOutputDirectory,
  htmlFileGlobs,
  debug,
}: PluginOptions): PluginOption[] {
  // Resolved options
  const sourceDirectory = resolve(cwd, directory)
  const tsConfigFilePath = resolve(sourceDirectory, tsConfig ?? 'tsconfig.json')
  const resolvedServerFilePath = resolve(sourceDirectory, serverFilePath ?? 'server.ts')
  const resolvedServerOutputDirectory = resolve(
    sourceDirectory,
    serverOutputDirectory ?? 'dist/server',
  )
  const resolvedClientOutputDirectory = resolve(
    sourceDirectory,
    clientOutputDirectory ?? 'dist/client',
  )
  const defaultIncludeExcludeTs = {
    include: ['**/*.ts', '**/*.tsx'],
    exclude: ['dist/**/*'],
  }
  const resolvedEffectTsOptions = {
    trace: defaultIncludeExcludeTs,
    optimize: defaultIncludeExcludeTs,
    debug: debug ? defaultIncludeExcludeTs : {},
  }

  const dependentsMap = new Map<string, Set<string>>()
  const filePathToModule = new Map<string, SourceFile>()

  let devServer: ViteDevServer
  let project: Project
  let transformers: ts.CustomTransformers

  const serverExists = existsSync(resolvedServerFilePath)

  const plugins: PluginOption[] = [
    tsconfigPaths({
      projects: [join(sourceDirectory, 'tsconfig.json')],
    }),
    ...(serverExists
      ? [
          vavite({
            serverEntry: resolvedServerFilePath,
            serveClientAssetsInDev: true,
          }),
        ]
      : []),
  ]

  const setupProject = () => {
    if (project) {
      return
    }

    info(`Setting up TypeScript project...`)
    project = setupTsProject(tsConfigFilePath)
    info(`Setup TypeScript project.`)

    // Setup transformer for virtual modules.
    transformers = {
      before: [
        // Types are weird for some reason
        (effectTransformer as any as typeof effectTransformer.default)(
          project.getProgram().compilerObject,
          resolvedEffectTsOptions,
        ).before,
      ],
    }
  }

  const transpilerCompilerOptions = (): CompilerOptions => {
    setupProject()

    return {
      ...project.getCompilerOptions(),
      allowJs: true,
    }
  }

  const handleFileChange = async (path: string, event: 'create' | 'update' | 'delete') => {
    if (/\.tsx?$/.test(path) || /\.jsx?$/.test(path)) {
      switch (event) {
        case 'create': {
          project.addSourceFileAtPath(path)
          break
        }
        case 'update': {
          const sourceFile = project.getSourceFile(path)

          if (sourceFile) {
            sourceFile.refreshFromFileSystemSync()
          } else {
            project.addSourceFileAtPath(path)
          }

          if (devServer) {
            const dependents = dependentsMap.get(path.replace(/.ts(x)?/, '.js$1'))

            for (const dependent of dependents ?? []) {
              const mod = devServer.moduleGraph.getModuleById(dependent)

              if (mod) {
                info(`reloading ${dependent}`)

                await devServer.reloadModule(mod)
              }
            }
          }

          break
        }
        case 'delete': {
          await project.getSourceFile(path)?.deleteImmediately()
          break
        }
      }
    }
  }

  const buildRenderModule = async (importer: string, id: string) => {
    const moduleDirectory = resolve(dirname(importer), parseModulesFromId(id, importer))
    const relativeDirectory = relative(sourceDirectory, moduleDirectory)
    const isBrowser = id.startsWith(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX)
    const moduleType = isBrowser ? 'browser' : 'runtime'
    const filePath = `${moduleDirectory}.${moduleType}.__generated__.ts`

    info(`Building ${moduleType} module for ${relativeDirectory}...`)

    const directory = await readDirectory(moduleDirectory)
    const moduleTree = readModules(project, directory)

    // Setup the TypeScript project if it hasn't been already
    setupProject()

    const mod = isBrowser
      ? makeBrowserModule(project, moduleTree, importer, filePath)
      : makeRuntimeModule(project, moduleTree, importer, filePath)

    info(`Built ${moduleType} module for ${relativeDirectory}.`)

    filePathToModule.set(filePath, mod)

    return filePath
  }

  const buildHtmlModule = async (importer: string, id: string) => {
    const htmlFileName = parseModulesFromId(id, importer)
    const htmlFilePath = resolve(dirname(importer), htmlFileName + '.html')
    const relativeHtmlFilePath = relative(sourceDirectory, htmlFilePath)
    let html = ''

    info(`Building html module for ${relativeHtmlFilePath}...`)

    // If there's a dev server, use it to transform the HTML for development
    if (devServer) {
      html = (await readFile(htmlFilePath, 'utf-8')).toString()
      html = await devServer.transformIndexHtml(
        getRelativePath(sourceDirectory, htmlFilePath),
        html,
      )
    } else {
      // Otherwise, read the already transformed file from the output directory.
      html = (
        await readFile(resolve(resolvedClientOutputDirectory, relativeHtmlFilePath), 'utf-8')
      ).toString()
    }

    const sourceFile = await makeHtmlModule({
      project,
      filePath: htmlFilePath,
      html,
      importer,
      serverOutputDirectory: resolvedServerOutputDirectory,
      clientOutputDirectory: resolvedClientOutputDirectory,
      devServer,
    })

    info(`Built html module for ${relativeHtmlFilePath}.`)

    const filePath = sourceFile.getFilePath()

    filePathToModule.set(filePath, sourceFile)

    return filePath
  }

  const virtualModulePlugin = {
    name: PLUGIN_NAME,
    config(config: UserConfig, env: ConfigEnv) {
      // Configure Build steps when running with vavite
      if (env.mode === 'multibuild') {
        const clientBuild: UserConfig['build'] = {
          outDir: resolvedClientOutputDirectory,
          rollupOptions: {
            input: buildClientInput(
              findHtmlFiles(sourceDirectory, htmlFileGlobs).map((p) => resolve(sourceDirectory, p)),
            ),
          },
        }

        const serverBuild: UserConfig['build'] = {
          ssr: true,
          outDir: resolvedServerOutputDirectory,
          rollupOptions: {
            input: resolvedServerFilePath,
          },
        }

        ;(config as any).buildSteps = [
          {
            name: 'client',
            // @ts-expect-error Unable to resolve types w/ NodeNext
            config: { build: clientBuild, plugins: [compression()] },
          },
          ...(serverExists
            ? [
                {
                  name: 'server',
                  config: { build: serverBuild },
                },
              ]
            : []),
        ]

        return
      }
    },

    configureServer(server) {
      devServer = server

      server.watcher.on('all', (event, path) => {
        if (event === 'change') {
          handleFileChange(path, 'update')
        } else if (event === 'add') {
          handleFileChange(path, 'create')
        } else if (event === 'unlink') {
          handleFileChange(path, 'delete')
        }
      })
    },

    async watchChange(path, { event }) {
      handleFileChange(path, event)
    },

    closeBundle() {
      if (project) {
        const diagnostics = project.getPreEmitDiagnostics()

        if (diagnostics.length > 0) {
          this.error(project.formatDiagnosticsWithColorAndContext(diagnostics))
        }
      }
    },

    async resolveId(id: string, importer?: string) {
      if (!importer) {
        return
      }

      if (
        id.startsWith(RUNTIME_VIRTUAL_ENTRYPOINT_PREFIX) ||
        id.startsWith(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX)
      ) {
        setupProject()

        return VIRTUAL_ID_PREFIX + (await buildRenderModule(importer, id))
      }

      if (id.startsWith(HTML_VIRTUAL_ENTRYPOINT_PREFIX)) {
        setupProject()

        return VIRTUAL_ID_PREFIX + (await buildHtmlModule(importer, id))
      }

      importer = importer.replace(VIRTUAL_ID_PREFIX, '')

      // Virtual modules have problems with resolving relative paths due to not
      // having a real directory to work with thus the need to resolve them manually.
      if (filePathToModule.has(importer) && id.startsWith('.')) {
        return findRelativeFile(importer, id)
      }
    },

    async load(id: string) {
      id = id.replace(VIRTUAL_ID_PREFIX, '')

      const sourceFile = filePathToModule.get(id) ?? project?.getSourceFile(id)

      if (sourceFile) {
        logDiagnostics(project, sourceFile, sourceDirectory, id)

        const text = sourceFile.getFullText()
        const output = ts.transpileModule(text, {
          fileName: id,
          compilerOptions: transpilerCompilerOptions(),
          transformers,
        })

        return {
          code: output.outputText,
          map: output.sourceMapText,
        }
      }
    },

    transform(text: string, id: string) {
      if (/.tsx?$/.test(id) || /.m?jsx?$/.test(id)) {
        const output = ts.transpileModule(text, {
          fileName: id,
          compilerOptions: transpilerCompilerOptions(),
          transformers,
        })

        return {
          code: output.outputText,
          map: output.sourceMapText,
        }
      }
    },
  } satisfies Plugin

  plugins.push(virtualModulePlugin)

  return plugins
}

function logDiagnostics(
  project: Project,
  sourceFile: SourceFile,
  sourceDirectory: string,
  filePath: string,
) {
  const diagnostics = sourceFile.getPreEmitDiagnostics()
  const relativeFilePath = relative(sourceDirectory, filePath)

  if (diagnostics.length > 0) {
    info(sourceFile.getFullText())
    info(project.formatDiagnosticsWithColorAndContext(diagnostics))
  } else {
    info(`${relativeFilePath} module successfuly typed-checked.`)
  }
}

function findRelativeFile(importer: string, id: string) {
  const dir = dirname(importer)
  const tsPath = resolve(dir, id.replace(/.js(x)?$/, '.ts$1'))

  if (existsSync(tsPath)) {
    return tsPath
  }

  const jsPath = resolve(dir, id)

  if (existsSync(jsPath)) {
    return tsPath
  }
}

function parseModulesFromId(id: string, importer: string | undefined): string {
  const pages = id
    .replace(RUNTIME_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')
    .replace(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')
    .replace(HTML_VIRTUAL_ENTRYPOINT_PREFIX + ':', '')

  if (pages === '') {
    throw new Error(`[${PLUGIN_NAME}]: No pages were specified from ${importer}`)
  }

  return pages
}

function findHtmlFiles(directory: string, htmlFileGlobs?: readonly string[]): readonly string[] {
  if (htmlFileGlobs) {
    // eslint-disable-next-line import/no-named-as-default-member
    return glob.sync([...htmlFileGlobs], { cwd: directory })
  }

  // eslint-disable-next-line import/no-named-as-default-member
  return glob.sync(['**/*.html', '!' + '**/node_modules/**', '!' + '**/dist/**'], {
    cwd: directory,
  })
}

function buildClientInput(htmlFilePaths: readonly string[]) {
  const input: Record<string, string> = {}

  for (const htmlFilePath of htmlFilePaths) {
    const htmlFile = basename(htmlFilePath, '.html')

    input[htmlFile] = htmlFilePath
  }

  return input
}

function getRelativePath(from: string, to: string) {
  const path = relative(from, to)

  if (!path.startsWith('.')) {
    return './' + path
  }

  return path
}

function info(message: string) {
  const date = new Date()

  console.info(`[${PLUGIN_NAME}] ${date.toISOString()};`, `${message}`)
}
