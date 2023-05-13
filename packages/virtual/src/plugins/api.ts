import { basename, dirname, resolve } from 'path'

import ts from 'typescript'

import { Directory, readDirectory } from '../util'
import { VirtualModulePlugin } from '../virtual-module'

const apiRegex = /^api:(.+)/

export const ApiPlugin: VirtualModulePlugin = {
  name: '@typed/virtual/api',
  match: apiRegex,
  resolveFileName: ({ id, importer }) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [, path] = apiRegex.exec(id)!
    const dir = dirname(importer)
    const name = `${basename(path)}.api.__generated__.ts`

    return resolve(dir, name)
  },
  createContent: ({ id, importer, getProgram, log }) => {
    const importDirectory = dirname(importer)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [, moduleName] = apiRegex.exec(id)!
    const moduleDirectory = resolve(importDirectory, moduleName)
    const directory = readDirectory(moduleDirectory)
    const moduleTree = readApiModuleTree(getProgram(), directory)

    log?.(JSON.stringify(moduleTree))

    return 'export const handlers = [] as const'
  },
}

function readApiModuleTree(
  program: ts.Program,
  directory: Directory,
  existingEnvironmentTree: EnvironmentTree = new EnvironmentTree(null, []),
): ApiModuleTree {
  const modules = scanApiSourceFiles(directory.files, program)
  const fetchHandlerFiles = modules.filter(isFetchHandlerFile)
  const environmentFiles = modules.filter(isEnvironmentFile)
  const environmentTree = existingEnvironmentTree.addChildren(environmentFiles)

  return {
    handlers: fetchHandlerFiles,
    environments: environmentTree,
    children: directory.directories.map((dir) => readApiModuleTree(program, dir, environmentTree)),
  }
}

export interface ApiModuleTree {
  readonly handlers: readonly FetchHandlerFile[]
  readonly environments: EnvironmentTree
  readonly children: readonly ApiModuleTree[]
}

export class EnvironmentTree {
  constructor(
    readonly parent: EnvironmentTree | null,
    readonly environmentFiles: readonly EnvironmentFile[],
  ) {}

  addChildren(children: readonly EnvironmentFile[]): EnvironmentTree {
    return new EnvironmentTree(this, children)
  }
}

function scanApiSourceFiles(
  files: readonly string[],
  program: ts.Program,
): readonly ApiSourceFile[] {
  return files.flatMap((file) => {
    const sourceFile = program.getSourceFile(file)

    if (sourceFile) {
      const parsed = parseApiSourceFile(sourceFile, program)

      return parsed ? [parsed] : []
    }

    return []
  })
}

function parseApiSourceFile(
  sourceFile: ts.SourceFile,
  program: ts.Program,
): ApiSourceFile | undefined {
  const { fileName } = sourceFile

  if (isEnvironmentFileName(fileName)) {
    return parseEnvironmentSourceFile(sourceFile, program)
  }

  return parseFetchHandlerSourceFile(sourceFile, program)
}

function parseEnvironmentSourceFile(
  _sourceFile: ts.SourceFile,
  program: ts.Program,
): EnvironmentFile | undefined {
  const typeChecker = program.getTypeChecker()

  return undefined
}

function parseFetchHandlerSourceFile(
  _sourceFile: ts.SourceFile,
  _program: ts.Program,
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

function isFetchHandlerFile(file: ApiSourceFile): file is FetchHandlerFile {
  return file._tag === 'FetchHandler'
}

function isEnvironmentFile(file: ApiSourceFile): file is EnvironmentFile {
  return file._tag === 'Environment'
}
