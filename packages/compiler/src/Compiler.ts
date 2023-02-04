import { existsSync, readFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { EOL } from 'os'
import { basename, dirname, relative, resolve } from 'path'

import effectTransformer from '@effect/language-service/transformer'
import { parseHtmlImports, parseBasePath } from '@typed/framework/html'
import { Project, SourceFile, ts } from 'ts-morph'
import type { ViteDevServer, BuildOptions } from 'vite'

import type { EntryFile, Manifest, ManifestEntry } from './Manifest.js'
import type { ResolvedOptions } from './ResolvedOptions.js'
import {
  API_VIRTUAL_ENTRYPOINT_PREFIX,
  BROWSER_VIRTUAL_ENTRYPOINT_PREFIX,
  EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX,
  HTML_VIRTUAL_ENTRYPOINT_PREFIX,
  NAME,
  PREFIXES,
  RUNTIME_VIRTUAL_ENTRYPOINT_PREFIX,
  TYPED_CONFIG_IMPORT,
  VIRTUAL_ID_PREFIX,
} from './constants.js'
import { getRelativePath } from './getRelativePath.js'
import { apiModuleTreeToJson, moduleTreeToJson } from './json.js'
import { makeApiModule } from './makeApiModule.js'
import { addOrUpdateBase, makeHtmlModule } from './makeHtmlModule.js'
import { makeRuntimeModule } from './makeRuntimeModule.js'
import { readApiModules } from './readApiModules.js'
import { readDirectory } from './readDirectory.js'
import { readModules } from './readModules.js'
import { setupTsProject } from './setupTsProject.js'

const TS_REGEX = /.[c|m]?tsx?$/

export class Compiler {
  readonly manifest: Manifest = {
    entryFiles: [],
    modules: {},
  }

  protected project: Project
  protected transformers!: ts.CustomTransformers
  protected dependents = new Map<string, Set<string>>()
  protected filePathToModule = new Map<string, SourceFile>()

  constructor(readonly pluginName: string, readonly options: ResolvedOptions) {
    this.log(`Setting up TypeScript Project...`)
    this.project = setupTsProject(options.tsConfig)
    this.log(`TypeScript Project setup complete.`)
  }

  readonly parseInput = (input: NonNullable<BuildOptions['rollupOptions']>['input']) => {
    if (!input) return []

    const sourceDirectory = this.options.sourceDirectory

    if (typeof input === 'string') {
      this.manifest.entryFiles.push(parseEntryFile(sourceDirectory, input))
    } else if (Array.isArray(input)) {
      this.manifest.entryFiles.push(...input.map((i) => parseEntryFile(sourceDirectory, i)))
    } else {
      this.manifest.entryFiles.push(
        ...Object.values(input).map((i) => parseEntryFile(sourceDirectory, i)),
      )
    }

    return this.manifest.entryFiles
  }

  readonly resolveId = async (id: string, importer?: string, devServer?: ViteDevServer) => {
    if (!importer) return

    if (
      id.startsWith(RUNTIME_VIRTUAL_ENTRYPOINT_PREFIX) ||
      id.startsWith(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX)
    ) {
      return await this.makeRuntimeModule(importer, id)
    }

    if (id.startsWith(HTML_VIRTUAL_ENTRYPOINT_PREFIX)) {
      return await this.makeHtmlModule(importer, id, devServer)
    }

    if (
      id.startsWith(API_VIRTUAL_ENTRYPOINT_PREFIX) ||
      id.startsWith(EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX)
    ) {
      return await this.makeApiModule(importer, id)
    }

    if (id === TYPED_CONFIG_IMPORT) {
      return VIRTUAL_ID_PREFIX + TYPED_CONFIG_IMPORT
    }

    importer = importer.replace(VIRTUAL_ID_PREFIX, '')

    // Virtual modules have problems with resolving relative paths due to not
    // having a real directory to work with thus the need to resolve them manually.
    if (this.filePathToModule.has(importer) && id.startsWith('.')) {
      return findRelativeFile(importer, id)
    }
  }

  readonly load = (id: string) => {
    id = id.replace(VIRTUAL_ID_PREFIX, '')

    const sourceFile = this.filePathToModule.get(id) ?? this.project?.getSourceFile(id)

    if (sourceFile) {
      return {
        code: sourceFile.getFullText(),
      }
    }

    if (id === TYPED_CONFIG_IMPORT) {
      return {
        code: Object.entries(this.options)
          .map(([key, value]) => `export const ${key} = ${JSON.stringify(value)}`)
          .join(EOL),
      }
    }
  }

  readonly transpileTsModule = (text: string, id: string, devServer?: ViteDevServer) => {
    if (TS_REGEX.test(id)) {
      const output = ts.transpileModule(text, {
        fileName: id,
        compilerOptions: this.transpilerOptions(devServer),
        transformers: this.transformers || this.setupTransformers(),
      })

      return {
        code: output.outputText,
        map: output.sourceMapText,
      }
    }
  }

  readonly transformHtml = (html: string) => {
    return addOrUpdateBase(html, this.options.base)
  }

  readonly handleFileChange = async (
    path: string,
    event: 'create' | 'update' | 'delete',
    devServer?: ViteDevServer,
  ): Promise<void> => {
    if (TS_REGEX.test(path)) {
      switch (event) {
        case 'create': {
          this.project.addSourceFileAtPath(path)
          break
        }
        case 'update': {
          const sourceFile = this.project.getSourceFile(path)

          if (sourceFile) {
            sourceFile.refreshFromFileSystemSync()
          } else {
            this.project.addSourceFileAtPath(path)
          }

          if (devServer) {
            const dependents = this.dependents.get(path.replace(/.ts(x)?/, '.js$1'))

            for (const dependent of dependents ?? []) {
              const mod = devServer.moduleGraph.getModuleById(dependent)

              if (mod) {
                await devServer.reloadModule(mod)
              }
            }
          }

          break
        }
        case 'delete': {
          await this.project.getSourceFile(path)?.deleteImmediately()
          break
        }
      }
    }
  }

  readonly logDiagnostics = () => {
    const diagnostics = this.project.getPreEmitDiagnostics()

    if (diagnostics.length > 0) {
      console.error(this.project.formatDiagnosticsWithColorAndContext(diagnostics))
    }
  }

  readonly throwDiagnostics = () => {
    const diagnostics = this.project.getPreEmitDiagnostics()

    if (diagnostics.length > 0) {
      throw new Error(this.project.formatDiagnosticsWithColorAndContext(diagnostics))
    }
  }

  protected makeRuntimeModule = async (importer: string, id: string): Promise<string> => {
    const moduleDirectory = resolve(dirname(importer), parseModulesFromId(id, importer))
    const isBrowser = id.startsWith(BROWSER_VIRTUAL_ENTRYPOINT_PREFIX)
    const moduleType = isBrowser ? 'browser' : 'runtime'
    const filePath = `${moduleDirectory}.${moduleType}.__generated__.ts`
    const directory = await readDirectory(moduleDirectory)
    const moduleTree = readModules(this.project, directory)
    const sourceFile = makeRuntimeModule(this.project, moduleTree, importer, filePath, isBrowser)

    this.log(
      `Generated ${moduleType} module for ${relative(
        this.options.sourceDirectory,
        moduleDirectory,
      )}`,
    )

    this.addManifestEntry(
      {
        type: moduleType,
        ...moduleTreeToJson(this.options.sourceDirectory, moduleTree),
      },
      relative(this.options.sourceDirectory, importer),
      id,
    )

    addDependents(sourceFile, this.dependents)

    this.filePathToModule.set(filePath, sourceFile)

    if (this.options.saveGeneratedModules && !this.options.isStaticBuild) {
      await sourceFile.save()
    }

    return VIRTUAL_ID_PREFIX + filePath
  }

  protected makeHtmlModule = async (
    importer: string,
    id: string,
    devServer?: ViteDevServer,
  ): Promise<string> => {
    const sourceDirectory = this.options.sourceDirectory
    const htmlFileName = parseModulesFromId(id, importer)
    const htmlFilePath = resolve(dirname(importer), htmlFileName + '.html')
    const relativeHtmlFilePath = relative(sourceDirectory, htmlFilePath)
    const html = await this.readHtml(htmlFilePath, devServer)
    const sourceFile = await makeHtmlModule({
      project: this.project,
      base: parseBasePath(html),
      filePath: htmlFilePath,
      html,
      importer,
      serverOutputDirectory: this.options.serverOutputDirectory,
      clientOutputDirectory: this.options.clientOutputDirectory,
      build: this.options.isStaticBuild ? 'static' : devServer ? 'development' : 'production',
    })

    this.log(`Generated HTML module for ${relativeHtmlFilePath}`)

    this.addManifestEntry(
      {
        type: 'html',
        filePath: relativeHtmlFilePath,
      },
      relative(sourceDirectory, importer),
      id,
    )

    addDependents(sourceFile, this.dependents)

    const filePath = sourceFile.getFilePath()

    this.filePathToModule.set(filePath, sourceFile)

    if (this.options.saveGeneratedModules) {
      await sourceFile.save()
    }

    return VIRTUAL_ID_PREFIX + filePath
  }

  protected makeApiModule = async (importer: string, id: string) => {
    const sourceDirectory = this.options.sourceDirectory
    const importDirectory = dirname(importer)
    const moduleName = parseModulesFromId(id, importer)
    const moduleDirectory = resolve(importDirectory, moduleName)
    const moduleType = id.startsWith(EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX) ? 'express' : 'api'
    const directory = await readDirectory(moduleDirectory)
    const moduleTree = readApiModules(this.project, directory)
    const filePath = `${importDirectory}/${basename(
      moduleName,
    )}.${moduleType.toLowerCase()}.__generated__.ts`
    const sourceFile = makeApiModule(
      this.project,
      moduleTree,
      filePath,
      importer,
      id.startsWith(EXPRESS_VIRTUAL_ENTRYPOINT_PREFIX),
    )

    this.log(
      `Generated ${moduleType} module for ${relative(
        this.options.sourceDirectory,
        moduleDirectory,
      )}`,
    )

    this.addManifestEntry(
      {
        type: moduleType,
        ...apiModuleTreeToJson(sourceDirectory, moduleTree),
      },
      relative(sourceDirectory, importer),
      id,
    )

    addDependents(sourceFile, this.dependents)

    this.filePathToModule.set(filePath, sourceFile)

    if (this.options.saveGeneratedModules) {
      await sourceFile.save()
    }

    return VIRTUAL_ID_PREFIX + filePath
  }

  protected transpilerOptions(devServer?: ViteDevServer) {
    if (devServer) {
      return {
        ...this.project.getCompilerOptions(),
        inlineSourceMap: true,
        inlineSources: true,
        sourceMap: false,
      }
    }

    return {
      ...this.project.getCompilerOptions(),
      inlineSourceMap: false,
      inlineSources: this.options.saveGeneratedModules,
      sourceMap: true,
    }
  }

  protected setupTransformers() {
    const defaultIncludeExcludeTs = {
      include: ['**/*.ts', '**/*.tsx'],
      exclude: this.options.exclusions.slice(),
    }

    const resolvedEffectTsOptions = {
      trace: defaultIncludeExcludeTs,
      optimize: defaultIncludeExcludeTs,
      debug: this.options.debug ? defaultIncludeExcludeTs : {},
    }

    return (this.transformers = {
      before: [
        // Types are weird for some reason
        (effectTransformer as any as typeof effectTransformer.default)(
          this.project.getProgram().compilerObject,
          resolvedEffectTsOptions,
        ).before,
      ],
    })
  }

  protected addManifestEntry(entry: ManifestEntry, importer: string, id: string) {
    if (!this.manifest.modules[importer]) {
      this.manifest.modules[importer] = {}
    }

    this.manifest.modules[importer][id] = entry
  }

  protected async readHtml(htmlFilePath: string, devServer?: ViteDevServer) {
    // If there's a dev server, use it to transform the HTML for development
    if (!this.options.isStaticBuild && devServer) {
      return await devServer.transformIndexHtml(
        getRelativePath(this.options.sourceDirectory, htmlFilePath),
        (await readFile(htmlFilePath, 'utf-8')).toString(),
      )
    }

    return (
      await readFile(
        resolve(
          this.options.clientOutputDirectory,
          relative(this.options.sourceDirectory, htmlFilePath),
        ),
        'utf-8',
      )
    ).toString()
  }

  protected log(...messages: string[]) {
    console.info(`[${this.pluginName}]:`, ...messages)
  }
}

const addDependents = (sourceFile: SourceFile, dependentsMap: Map<string, Set<string>>) => {
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

function parseModulesFromId(id: string, importer: string | undefined): string {
  let pages = id

  for (const prefix of PREFIXES) {
    pages = pages.replace(prefix + ':', '')
  }

  if (pages === '') {
    throw new Error(`[${NAME}]: No pages were specified from ${importer}`)
  }

  return pages
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

function parseTsEntryFile(sourceDirectory: string, filePath: string): EntryFile {
  return {
    type: 'ts',
    filePath: relative(sourceDirectory, filePath),
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
