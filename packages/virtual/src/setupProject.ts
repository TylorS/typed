import { dirname, relative, resolve } from 'path'

import ts from 'typescript'

import { createModuleResolutionCache } from './cache'
import { findConfigFile, readConfigFile } from './config'
import { getCustomTransformers, getScriptSnapshot, resolveModuleNameLiterals } from './host'
import { Project } from './project'
import { Service } from './service'
import { Directory, readDirectory } from './util'
import { VirtualModulePlugin } from './virtual-module'
import { VirtualModuleManager } from './virtual-module-manager'

const apiRegex = /^api:(.+)/

const ApiVirtualModulePlugin: VirtualModulePlugin = {
  name: '@typed/virtual/api',
  match: apiRegex,
  resolveFileName: ({ id, importer }) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [, path] = apiRegex.exec(id)!
    const dir = dirname(importer)
    const name = `${relative(dir, path)}.api.__generated__.ts`

    return resolve(dir, name)
  },
  createContent: ({ id, fileName, importer, project }) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const program = project.getProgram()!
    const importDirectory = dirname(importer)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [, moduleName] = apiRegex.exec(id)!
    const moduleDirectory = resolve(importDirectory, moduleName)
    const directory = readDirectory(moduleDirectory)
    const moduleTree = readApiModuleTree(project, directory)
  },
}

export function setupProject(service: Service, workingDirectory: string, tsConfigPath: string) {
  const tsConfigFilePath = findConfigFile(workingDirectory, tsConfigPath)

  if (!tsConfigFilePath) {
    throw new Error(`Cannot find TsConfig in ${workingDirectory} for ${tsConfigPath}`)
  }

  const config = readConfigFile(tsConfigFilePath)

  if (!config) {
    throw new Error(`Cannot read TsConfig file at ${tsConfigFilePath}`)
  }

  if (!config?.options) {
    config.options = {}
  }

  // Overrides for virtual modules
  config.options.inlineSources = true

  return service.openProject(config, (project) => {
    const host = project.languageServiceHost
    const moduleResolutionCache = createModuleResolutionCache(
      host.getCurrentDirectory(),
      config.options,
    )

    const manager = new VirtualModuleManager([ApiVirtualModulePlugin], project)

    host.resolveModuleNameLiterals = resolveModuleNameLiterals(host, moduleResolutionCache, manager)
    host.getScriptSnapshot = getScriptSnapshot(project.projectFiles, project.externalFiles, manager)
    host.getCustomTransformers = getCustomTransformers(manager)
  })
}

function readApiModuleTree(project: Project, directory: Directory) {
  const modules = scanApiSourceFiles(directory.files, project)
  const apiModules = modules.filter(isApiModule)
  const environments = modules.filter(isEnvironmentModule)
  const errors: string[] = []

  if (environments.length > 1) {
    errors.push(`Multiple environments found in ${directory.directory}`)
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }
}

function scanApiSourceFiles(files: readonly string[], project: Project): readonly ApiSourceFile[] {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const program = project.getProgram()!

  return files.flatMap((file) => {
    const sourceFile = program.getSourceFile(file)

    if (sourceFile) {
      const parsed = parseApiSourceFile(sourceFile, project)

      return parsed ? [parsed] : []
    }

    return []
  })
}

function parseApiSourceFile(
  sourceFile: ts.SourceFile,
  project: Project,
): ApiSourceFile | undefined {
  const { fileName } = sourceFile

  if (isEnvironmentFileName(fileName)) {
    return parseEnvironmentSourceFile(sourceFile, project)
  }

  return parseFetchHandlerSourceFile(sourceFile, project)
}

function parseEnvironmentSourceFile(
  sourceFile: ts.SourceFile,
  project: Project,
): EnvironmentFile | undefined {
  return undefined
}

function parseFetchHandlerSourceFile(
  sourceFile: ts.SourceFile,
  project: Project,
): FetchHandlerFile | undefined {
  return undefined
}

// TODO: Fetch All Exported Symbols
// TODO: Match exported symbols to declarations
// TODO: Resolve Types for declarations
// TODO: Validate Types match expected types

function isEnvironmentFileName(fileName: string): boolean {
  return fileName.endsWith('.environment.ts')
}

export type ApiSourceFile = FetchHandlerFile | EnvironmentFile

export interface FetchHandlerFile {
  readonly _tag: 'FetchHandler'
  readonly file: string
}

export interface EnvironmentFile {
  readonly _tag: 'Environment'
  readonly file: string
}
