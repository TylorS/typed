import { existsSync, readFileSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { EOL } from 'os'
import { basename, dirname, join, relative, resolve } from 'path'

import effectTransformer from '@effect/language-service/transformer'
import {
  setupTsProject,
  makeHtmlModule,
  makeRuntimeModule,
  readDirectory,
  readModules,
  readApiModules,
  makeApiModule,
  type ApiModuleTreeJson,
  type ModuleTreeJsonWithFallback,
  moduleTreeToJson,
  apiModuleTreeToJson,
  addOrUpdateBase,
} from '@typed/compiler'
import glob from 'fast-glob'
import { Project, SourceFile, ts, type CompilerOptions } from 'ts-morph'
// @ts-expect-error Unable to resolve types w/ NodeNext
import vavite from 'vavite'
import type { ConfigEnv, Logger, Plugin, PluginOption, UserConfig, ViteDevServer } from 'vite'
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

export const PLUGIN_NAME = '@typed/vite-plugin'

export interface TypedVitePlugin extends Plugin {
  readonly name: typeof PLUGIN_NAME
  readonly resolvedOptions: ResolvedOptions
}

const RUNTIME_VIRTUAL_ENTRYPOINT_PREFIX = 'runtime'
const BROWSER_VIRTUAL_ENTRYPOINT_PREFIX = 'browser'
const HTML_VIRTUAL_ENTRYPOINT_PREFIX = 'html'
const API_VIRTUAL_ENTRYPOINT_PREFIX = 'api'
const EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX = 'express'
const TYPED_CONFIG_IMPORT = 'typed:config'

const PREFIXES = [
  RUNTIME_VIRTUAL_ENTRYPOINT_PREFIX,
  BROWSER_VIRTUAL_ENTRYPOINT_PREFIX,
  HTML_VIRTUAL_ENTRYPOINT_PREFIX,
  API_VIRTUAL_ENTRYPOINT_PREFIX,
  EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX,
]

const VIRTUAL_ID_PREFIX = '\0'

export interface Manifest {
  readonly entryFiles: EntryFile[]

  readonly modules: {
    [importer: string]: Record<string, ManifestEntry>
  }
}

export interface ClientManifest extends Manifest {
  readonly entryFiles: HtmlEntryFile[]

  readonly modules: {
    [importer: string]: Record<string, ManifestEntry>
  }
}

export type EntryFile = HtmlEntryFile | TsEntryFile

export interface HtmlEntryFile {
  readonly type: 'html'
  readonly filePath: string
  readonly imports: string[]
  readonly basePath: string
}

export interface TsEntryFile {
  readonly type: 'ts'
  readonly filePath: string
}

export type ManifestEntry =
  | ApiManifestEntry
  | ExpressManifestEntry
  | HtmlManifestEntry
  | RuntimeManifestEntry
  | BrowserManifestEntry

export interface ApiManifestEntry extends ApiModuleTreeJson {
  readonly type: 'api'
}

export interface ExpressManifestEntry extends ApiModuleTreeJson {
  readonly type: 'express'
}

export interface HtmlManifestEntry {
  readonly type: 'html'
  readonly filePath: string
}

export interface BrowserManifestEntry extends ModuleTreeJsonWithFallback {
  readonly type: 'browser'
}

export interface RuntimeManifestEntry extends ModuleTreeJsonWithFallback {
  readonly type: 'runtime'
}

export interface ResolvedOptions {
  readonly sourceDirectory: string
  readonly tsConfig: string
  readonly serverFilePath: string
  readonly clientOutputDirectory: string
  readonly serverOutputDirectory: string
  readonly htmlFiles: readonly string[]
  readonly debug: boolean
  readonly saveGeneratedModules: boolean
  readonly isStaticBuild: boolean
  readonly base: string
}

export default function makePlugin({
  sourceDirectory: directory,
  tsConfig,
  serverFilePath,
  clientOutputDirectory,
  serverOutputDirectory,
  htmlFileGlobs,
  debug = false,
  saveGeneratedModules = false,
  isStaticBuild = false,
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

  const resolvedOptions: ResolvedOptions = {
    sourceDirectory,
    tsConfig: tsConfigFilePath,
    serverFilePath: resolvedServerFilePath,
    serverOutputDirectory: resolvedServerOutputDirectory,
    clientOutputDirectory: resolvedClientOutputDirectory,
    htmlFiles: findHtmlFiles(sourceDirectory, htmlFileGlobs).map((p) =>
      resolve(sourceDirectory, p),
    ),
    debug,
    saveGeneratedModules,
    isStaticBuild,
    base: '/',
  }

  const dependentsMap = new Map<string, Set<string>>()
  const filePathToModule = new Map<string, SourceFile>()
  const manifest: Manifest = {
    entryFiles: [],
    modules: {},
  }

  const addManifestEntry = (entry: ManifestEntry, importer: string, id: string) => {
    if (!manifest.modules[importer]) {
      manifest.modules[importer] = {}
    }

    manifest.modules[importer][id] = entry
  }

  let devServer: ViteDevServer
  let logger: Logger
  let isSsr = false
  let project: Project
  let transformers: ts.CustomTransformers

  const serverExists = existsSync(resolvedServerFilePath)

  const plugins: PluginOption[] = [
    tsconfigPaths({
      projects: [tsConfigFilePath],
    }),
    serverExists &&
      !isStaticBuild &&
      vavite({
        serverEntry: resolvedServerFilePath,
        serveClientAssetsInDev: true,
      }),
  ]

  const setupProject = () => {
    if (project) {
      return
    }

    info(`Setting up TypeScript project...`, logger)
    project = setupTsProject(tsConfigFilePath)
    info(`Setup TypeScript project.`, logger)

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
      inlineSourceMap: false,
      inlineSources: saveGeneratedModules,
      sourceMap: true,
    }
  }

  const handleFileChange = async (path: string, event: 'create' | 'update' | 'delete') => {
    if (/\.tsx?$/.test(path)) {
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
                info(`reloading ${dependent}`, logger)

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

  const buildRuntimeModule = async (importer: string, id: string) => {
    const moduleDirectory = resolve(dirname(importer), parseModulesFromId(id, importer))
    const relativeDirectory = relative(sourceDirectory, moduleDirectory)
    const isBrowser = id.startsWith(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX)
    const moduleType = isBrowser ? 'browser' : 'runtime'
    const filePath = `${moduleDirectory}.${moduleType}.__generated__.ts`
    const directory = await readDirectory(moduleDirectory)
    const moduleTree = readModules(project, directory)

    addManifestEntry(
      {
        type: moduleType,
        ...moduleTreeToJson(sourceDirectory, moduleTree),
      },
      relative(sourceDirectory, importer),
      id,
    )

    // Setup the TypeScript project if it hasn't been already
    setupProject()

    const sourceFile = makeRuntimeModule(project, moduleTree, importer, filePath, isBrowser)

    addDependents(sourceFile)

    info(`Built ${moduleType} module for ${relativeDirectory}.`, logger)

    filePathToModule.set(filePath, sourceFile)

    if (saveGeneratedModules) {
      await sourceFile.save()
    }

    return filePath
  }

  const buildHtmlModule = async (importer: string, id: string) => {
    const htmlFileName = parseModulesFromId(id, importer)
    const htmlFilePath = resolve(dirname(importer), htmlFileName + '.html')
    const relativeHtmlFilePath = relative(sourceDirectory, htmlFilePath)
    let html = ''

    // If there's a dev server, use it to transform the HTML for development
    if (!isStaticBuild && devServer) {
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
      base: parseBasePath(html),
      filePath: htmlFilePath,
      html,
      importer,
      serverOutputDirectory: resolvedServerOutputDirectory,
      clientOutputDirectory: resolvedClientOutputDirectory,
      build: isStaticBuild ? 'static' : devServer ? 'development' : 'production',
    })

    addManifestEntry(
      {
        type: 'html',
        filePath: relativeHtmlFilePath,
      },
      relative(sourceDirectory, importer),
      id,
    )

    addDependents(sourceFile)

    info(`Built html module for ${relativeHtmlFilePath}.`, logger)

    const filePath = sourceFile.getFilePath()

    filePathToModule.set(filePath, sourceFile)

    if (saveGeneratedModules) {
      await sourceFile.save()
    }

    return filePath
  }

  const buildApiModule = async (importer: string, id: string) => {
    const importDirectory = dirname(importer)
    const moduleName = parseModulesFromId(id, importer)
    const moduleDirectory = resolve(importDirectory, moduleName)
    const relativeDirectory = relative(sourceDirectory, moduleDirectory)
    const moduleType = id.startsWith(EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX) ? 'express' : 'api'
    const directory = await readDirectory(moduleDirectory)
    const moduleTree = readApiModules(project, directory)
    const filePath = `${importDirectory}/${basename(
      moduleName,
    )}.${moduleType.toLowerCase()}.__generated__.ts`

    const sourceFile = makeApiModule(
      project,
      moduleTree,
      filePath,
      importer,
      id.startsWith(EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX),
    )

    addManifestEntry(
      {
        type: moduleType,
        ...apiModuleTreeToJson(sourceDirectory, moduleTree),
      },
      relative(sourceDirectory, importer),
      id,
    )

    addDependents(sourceFile)

    info(`Built ${moduleType} module for ${relativeDirectory}.`, logger)

    filePathToModule.set(filePath, sourceFile)

    if (saveGeneratedModules) {
      await sourceFile.save()
    }

    return filePath
  }

  const addDependents = (sourceFile: SourceFile) => {
    const importer = sourceFile.getFilePath()
    const imports = sourceFile
      .getLiteralsReferencingOtherSourceFiles()
      .map((i) => i.getLiteralValue())

    for (const i of imports) {
      const dependents = dependentsMap.get(i) ?? new Set()

      dependents.add(importer)
      dependentsMap.set(i, dependents)
    }
  }

  const virtualModulePlugin: TypedVitePlugin = {
    name: PLUGIN_NAME,
    resolvedOptions,
    config(config: UserConfig, env: ConfigEnv) {
      isSsr = env.ssrBuild ?? false

      // Configure Build steps when running with vavite
      if (env.mode === 'multibuild') {
        const clientBuild: UserConfig['build'] = {
          outDir: resolvedClientOutputDirectory,
          rollupOptions: {
            input: buildClientInput(resolvedOptions.htmlFiles),
          },
        }

        const serverBuild: UserConfig['build'] = {
          ssr: true,
          outDir: resolvedServerOutputDirectory,
          rollupOptions: {
            input: {
              index: resolvedServerFilePath,
            },
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

    configResolved(resolvedConfig) {
      logger = resolvedConfig.logger

      const input = resolvedConfig.build.rollupOptions.input

      Object.assign(resolvedOptions, { base: resolvedConfig.base })

      if (!input) return

      if (typeof input === 'string') {
        manifest.entryFiles.push(parseEntryFile(sourceDirectory, input))
      } else if (Array.isArray(input)) {
        manifest.entryFiles.push(...input.map((i) => parseEntryFile(sourceDirectory, i)))
      } else {
        manifest.entryFiles.push(
          ...Object.values(input).map((i) => parseEntryFile(sourceDirectory, i)),
        )
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

    async closeBundle() {
      if (Object.keys(manifest).length > 0) {
        writeFileSync(
          resolve(
            isSsr ? resolvedServerOutputDirectory : resolvedClientOutputDirectory,
            'typed-manifest.json',
          ),
          JSON.stringify(manifest, null, 2) + EOL,
        )
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

        const virtualId = VIRTUAL_ID_PREFIX + (await buildRuntimeModule(importer, id))

        return virtualId
      }

      if (id.startsWith(HTML_VIRTUAL_ENTRYPOINT_PREFIX)) {
        setupProject()

        const virtualId = VIRTUAL_ID_PREFIX + (await buildHtmlModule(importer, id))

        return virtualId
      }

      if (
        id.startsWith(API_VIRTUAL_ENTRYPOINT_PREFIX) ||
        id.startsWith(EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX)
      ) {
        setupProject()

        const virtualId = VIRTUAL_ID_PREFIX + (await buildApiModule(importer, id))

        return virtualId
      }

      if (id === TYPED_CONFIG_IMPORT) {
        return VIRTUAL_ID_PREFIX + TYPED_CONFIG_IMPORT
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
        logDiagnostics(project, sourceFile, sourceDirectory, id, logger)

        return {
          code: sourceFile.getFullText(),
        }
      }

      if (id === TYPED_CONFIG_IMPORT) {
        return {
          code: Object.entries(resolvedOptions)
            .map(([key, value]) => `export const ${key} = ${JSON.stringify(value)}`)
            .join(EOL),
        }
      }
    },

    transform(text: string, id: string) {
      if (/.[c|m]?tsx?$/.test(id)) {
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

    transformIndexHtml(html: string) {
      // Add vite's base path to all HTML files
      return addOrUpdateBase(html, resolvedOptions.base)
    },
  }

  plugins.push(virtualModulePlugin)

  return plugins
}

function logDiagnostics(
  project: Project,
  sourceFile: SourceFile,
  sourceDirectory: string,
  filePath: string,
  logger: Logger | undefined,
) {
  const diagnostics = sourceFile.getPreEmitDiagnostics()
  const relativeFilePath = relative(sourceDirectory, filePath)

  if (diagnostics.length > 0) {
    info(`Type-checking errors found at ${relativeFilePath}`, logger)
    info(`Source:` + EOL + sourceFile.getFullText(), logger)
    info(project.formatDiagnosticsWithColorAndContext(diagnostics), logger)
  }
}

function findRelativeFile(importer: string, id: string) {
  const dir = dirname(importer)
  const tsPath = resolve(dir, id.replace(/.([c|m])?js(x)?$/, '.$1ts$2'))

  if (existsSync(tsPath)) {
    return tsPath
  }

  const jsPath = resolve(dir, id)

  if (existsSync(jsPath)) {
    return tsPath
  }
}

function parseModulesFromId(id: string, importer: string | undefined): string {
  let pages = id

  for (const prefix of PREFIXES) {
    pages = pages.replace(prefix + ':', '')
  }

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
  return htmlFilePaths.reduce(
    (acc, htmlFilePath) => ({ ...acc, [basename(htmlFilePath, '.html')]: htmlFilePath }),
    {},
  )
}

function getRelativePath(from: string, to: string) {
  const path = relative(from, to)

  if (!path.startsWith('.')) {
    return './' + path
  }

  return path
}

function info(message: string, logger: Logger | undefined) {
  if (logger) {
    logger.info(`[${PLUGIN_NAME}]: ${message}`)
  } else {
    console.info(`[${PLUGIN_NAME}]:`, `${message}`)
  }
}

function parseEntryFile(sourceDirectory: string, filePath: string): EntryFile {
  if (filePath.endsWith('.html')) {
    return parseHtmlEntryFile(sourceDirectory, filePath)
  }

  return parseTsEntryFile(sourceDirectory, filePath)
}

function parseHtmlEntryFile(sourceDirectory: string, filePath: string): EntryFile {
  const content = readFileSync(filePath, 'utf-8').toString()

  return {
    type: 'html',
    filePath: relative(sourceDirectory, filePath),
    imports: parseHtmlImports(sourceDirectory, content),
    basePath: parseBasePath(content),
  }
}

function parseHtmlImports(sourceDirectory: string, content: string) {
  const imports: string[] = []

  const matches = content.match(/<script[^>]*src="([^"]*)"[^>]*>/g)

  if (matches) {
    for (const match of matches) {
      // If script is not type=module then skip
      if (!match.includes('type="module"')) {
        continue
      }

      const src = match.match(/src="([^"]*)"/)?.[1]

      if (src) {
        const fullPath = join(sourceDirectory, src)
        const relativePath = relative(sourceDirectory, fullPath)

        imports.push(relativePath)
      }
    }
  }

  return imports
}

function parseBasePath(content: string) {
  const baseTag = content.match(/<base[^>]*>/)?.[0]

  if (baseTag) {
    const href = baseTag.match(/href="([^"]*)"/)?.[1]

    if (href) {
      return href
    }
  }

  return '/'
}

function parseTsEntryFile(sourceDirectory: string, filePath: string): EntryFile {
  return {
    type: 'ts',
    filePath: relative(sourceDirectory, filePath),
  }
}
