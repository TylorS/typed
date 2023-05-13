import { dirname } from 'path'

import ts from 'typescript/lib/tsserverlibrary'

import { ExternalFileCache, ProjectFileCache, createModuleResolutionCache } from './cache'
import { ensureRelative, removeQuotes } from './util'
import { VirtualModulePlugin } from './virtual-module'
import { VirtualModuleManager } from './virtual-module-manager'

export const resolveModuleNameLiterals = (
  moduleResolutionCache: ts.ModuleResolutionCache,
  host: ts.LanguageServiceHost,
  manager: VirtualModuleManager,
): NonNullable<ts.LanguageServiceHost['resolveModuleNameLiterals']> => {
  const resolveModuleNameLiterals_ = host.resolveModuleNameLiterals?.bind(host)

  const resolver = (
    moduleName: ts.StringLiteralLike,
    containingFile: string,
    redirectedReference: ts.ResolvedProjectReference | undefined,
    options: ts.CompilerOptions,
  ) => {
    const name = moduleName.text

    if (manager.match(name)) {
      const resolvedFileName = manager.resolveFileName({
        id: name,
        importer: containingFile,
      })

      manager.log(`Resolve ${name} to ${resolvedFileName}`)

      const resolved: ts.ResolvedModuleWithFailedLookupLocations = {
        resolvedModule: {
          extension: ts.Extension.Ts,
          resolvedFileName,
          isExternalLibraryImport: true,
          resolvedUsingTsExtension: false,
        },
      }

      return resolved
    }

    return ts.resolveModuleName(
      name,
      containingFile,
      options,
      host,
      moduleResolutionCache,
      redirectedReference,
      getModuleResolutionKind(options),
    )
  }

  return (moduleNames, containingFile, redirectedReference, options, ...rest) => {
    return moduleNames.map((name) => {
      const resolved = resolveModuleNameLiterals_?.(
        [name],
        containingFile,
        redirectedReference,
        options,
        ...rest,
      )?.[0] ??
        resolver(name, containingFile, redirectedReference, options) ?? {
          resolvedModule: undefined,
        }

      manager.log(`Resolved ${name.text} from ${resolved.resolvedModule?.resolvedFileName}`)

      return resolved
    })
  }
}

export type GetScriptSnapshotOptions = {
  readonly project?: ts.server.Project
  readonly projectFiles?: ProjectFileCache
  readonly externalFiles?: ExternalFileCache
}

export const getScriptSnapshot =
  (
    manager: VirtualModuleManager,
    getProgram: () => ts.Program,
    options?: GetScriptSnapshotOptions,
  ): ts.LanguageServiceHost['getScriptSnapshot'] =>
  (fileName) => {
    const { project, projectFiles, externalFiles } = options ?? {}

    if (projectFiles && projectFiles.has(fileName)) {
      return projectFiles.getSnapshot(fileName)
    }

    if (externalFiles && externalFiles.has(fileName)) {
      return externalFiles.getSnapshot(fileName)
    }

    if (manager.hasFileName(fileName)) {
      const content = manager.createContent(fileName, getProgram)
      const snapshot = ts.ScriptSnapshot.fromString(content)

      projectFiles?.set(fileName, snapshot)

      // Add the file to the project for language service plugin
      if (project) {
        const normalizedFileName = ts.server.toNormalizedPath(fileName)
        const scriptInfo = project.projectService.getOrCreateScriptInfoForNormalizedPath(
          normalizedFileName,
          true,
          content,
          ts.ScriptKind.TS,
          false,
          {
            fileExists(path) {
              if (path === fileName || path === normalizedFileName) {
                return true
              }

              return ts.sys.fileExists(path)
            },
          },
        )

        if (scriptInfo) {
          scriptInfo.attachToProject(project)
        }
      }

      return snapshot
    }

    const contents = ts.sys.readFile(fileName)

    if (contents === undefined) {
      return undefined
    }

    const snapshot = ts.ScriptSnapshot.fromString(contents)

    projectFiles?.set(fileName, snapshot)

    return snapshot
  }

export const getCustomTransformers =
  (manager: VirtualModuleManager) => (): ts.CustomTransformers => {
    return {
      before: [
        (context) => (sourceFile) => {
          const importer = sourceFile.fileName
          const directory = dirname(importer)

          const visitNode = (node: ts.Node): ts.Node => {
            if (ts.isImportDeclaration(node)) {
              const specifier = removeQuotes(node.moduleSpecifier.getText())

              if (manager.match(specifier)) {
                const resolvedFileName = manager.resolveFileName({
                  id: specifier,
                  importer,
                })

                const resolvedSpecifier = ts.factory.createStringLiteral(
                  ensureRelative(directory, resolvedFileName).replace(/.ts(x)?$/, '.js$1'),
                )

                return ts.factory.createImportDeclaration(
                  node.modifiers,
                  node.importClause,
                  resolvedSpecifier,
                  node.assertClause,
                )
              }

              return node
            }

            return ts.visitEachChild(node, visitNode, context)
          }

          return ts.visitEachChild(sourceFile, visitNode, context)
        },
      ],
    }
  }

export const patchLanguageServiceHost = (
  workingDirectory: string,
  config: ts.ParsedCommandLine,
  getProgram: () => ts.Program,
  host: ts.LanguageServiceHost,
  plugins: readonly VirtualModulePlugin[],
  options: GetScriptSnapshotOptions,
) => {
  const moduleResolutionCache = createModuleResolutionCache(workingDirectory, config.options)
  const manager = new VirtualModuleManager(plugins, host.log ?? console.log)

  host.getCurrentDirectory = () => workingDirectory

  host.resolveModuleNameLiterals = resolveModuleNameLiterals(moduleResolutionCache, host, manager)

  const getScriptKind = host.getScriptKind?.bind(host)

  host.getScriptKind = (fileName) => {
    if (!getScriptKind) {
      return ts.ScriptKind.Unknown
    }

    if (manager.match(fileName)) {
      return ts.ScriptKind.TS
    }

    return getScriptKind?.(fileName) ?? ts.ScriptKind.Unknown
  }

  const getScriptSnapshotTs = host.getScriptSnapshot.bind(host)
  const getScriptSnapshotVirtual = getScriptSnapshot(manager, getProgram, options)
  host.getScriptSnapshot = (...args) =>
    getScriptSnapshotTs?.(...args) ?? getScriptSnapshotVirtual(...args)

  return manager
}

export function getModuleResolutionKind(options: ts.CompilerOptions): ts.ResolutionMode {
  switch (options.moduleResolution) {
    case ts.ModuleResolutionKind.NodeJs:
      return ts.ModuleKind.CommonJS
    case ts.ModuleResolutionKind.Bundler:
    case ts.ModuleResolutionKind.Node16:
    case ts.ModuleResolutionKind.NodeNext:
      return ts.ModuleKind.ESNext
  }
}
