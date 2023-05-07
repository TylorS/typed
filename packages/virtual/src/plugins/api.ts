import { basename, dirname, resolve } from 'path'

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
  createContent: () => {
    // const importDirectory = dirname(importer)
    // // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    // const [, moduleName] = apiRegex.exec(id)!
    // const moduleDirectory = resolve(importDirectory, moduleName)
    // const directory = readDirectory(moduleDirectory)
    // // readApiModuleTree(project, directory)

    // TODO: Build content from moduleTree
    // Collect all imports to de-duplicate

    return 'export const handlers = [] as const'
  },
}

// function readApiModuleTree(
//   project: Project,
//   directory: Directory,
//   existingEnvironmentTree: EnvironmentTree = new EnvironmentTree(null, []),
// ): ApiModuleTree {
//   const modules = scanApiSourceFiles(directory.files, project)
//   const fetchHandlerFiles = modules.filter(isFetchHandlerFile)
//   const environmentFiles = modules.filter(isEnvironmentFile)
//   const environmentTree = existingEnvironmentTree.addChildren(environmentFiles)

//   return {
//     handlers: fetchHandlerFiles,
//     environments: environmentTree,
//     children: directory.directories.map((dir) => readApiModuleTree(project, dir, environmentTree)),
//   }
// }

// export interface ApiModuleTree {
//   readonly handlers: readonly FetchHandlerFile[]
//   readonly environments: EnvironmentTree
//   readonly children: readonly ApiModuleTree[]
// }

// export class EnvironmentTree {
//   constructor(
//     readonly parent: EnvironmentTree | null,
//     readonly environmentFiles: readonly EnvironmentFile[],
//   ) {}

//   addChildren(children: readonly EnvironmentFile[]): EnvironmentTree {
//     if (this.parent === null) {
//       return new EnvironmentTree(null, children)
//     }

//     return new EnvironmentTree(this, children)
//   }
// }

// function scanApiSourceFiles(files: readonly string[], project: Project): readonly ApiSourceFile[] {
//   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//   const program = project.getProgram()!

//   return files.flatMap((file) => {
//     const sourceFile = program.getSourceFile(file)

//     if (sourceFile) {
//       const parsed = parseApiSourceFile(sourceFile, project)

//       return parsed ? [parsed] : []
//     }

//     return []
//   })
// }

// function parseApiSourceFile(
//   sourceFile: ts.SourceFile,
//   project: Project,
// ): ApiSourceFile | undefined {
//   const { fileName } = sourceFile

//   if (isEnvironmentFileName(fileName)) {
//     return parseEnvironmentSourceFile(sourceFile, project)
//   }

//   return parseFetchHandlerSourceFile(sourceFile, project)
// }

// function parseEnvironmentSourceFile(
//   _sourceFile: ts.SourceFile,
//   _project: Project,
// ): EnvironmentFile | undefined {
//   return undefined
// }

// function parseFetchHandlerSourceFile(
//   _sourceFile: ts.SourceFile,
//   _project: Project,
// ): FetchHandlerFile | undefined {
//   return undefined
// }

// // TODO: Fetch All Exported Symbols
// // TODO: Match exported symbols to declarations
// // TODO: Resolve Types for declarations
// // TODO: Validate Types match expected types

// function isEnvironmentFileName(fileName: string): boolean {
//   return fileName.endsWith('.environment.ts')
// }

// export type ApiSourceFile = FetchHandlerFile | EnvironmentFile

// export interface FetchHandlerFile {
//   readonly _tag: 'FetchHandler'
//   readonly file: string
// }

// export interface EnvironmentFile {
//   readonly _tag: 'Environment'
//   readonly file: string
// }

// function isFetchHandlerFile(file: ApiSourceFile): file is FetchHandlerFile {
//   return file._tag === 'FetchHandler'
// }

// function isEnvironmentFile(file: ApiSourceFile): file is EnvironmentFile {
//   return file._tag === 'Environment'
// }
