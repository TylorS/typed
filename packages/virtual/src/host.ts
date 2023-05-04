import ts from 'typescript'

import { ExternalFileCache, ProjectFileCache } from './cache'
import { VirtualModuleManager } from './virtual-module-manager'

export const resolveModuleNameLiterals =
  (
    host: ts.LanguageServiceHost,
    moduleResolutionCache: ts.ModuleResolutionCache,
    manager: VirtualModuleManager,
  ): ts.LanguageServiceHost['resolveModuleNameLiterals'] =>
  (moduleNames, containingFile, redirectedReference, options) => {
    return moduleNames.map((moduleName) => {
      const name = moduleName.text

      if (manager.match(name)) {
        const resolvedFileName = manager.resolveFileName({
          id: name,
          importer: containingFile,
        })

        const resolved: ts.ResolvedModuleWithFailedLookupLocations = {
          resolvedModule: {
            extension: ts.Extension.Ts,
            resolvedFileName,
            isExternalLibraryImport: false,
            resolvedUsingTsExtension: false,
          },
        }

        return resolved
      }

      // TODO: Extends with virtual modules

      return ts.resolveModuleName(
        name,
        containingFile,
        options,
        host,
        moduleResolutionCache,
        redirectedReference,
      )
    })
  }

export const getScriptSnapshot =
  (
    projectFiles: ProjectFileCache,
    externalFiles: ExternalFileCache,
    manager: VirtualModuleManager,
  ): ts.LanguageServiceHost['getScriptSnapshot'] =>
  (fileName) => {
    if (projectFiles && projectFiles.has(fileName)) {
      return projectFiles.getSnapshot(fileName)
    }

    if (externalFiles && externalFiles.has(fileName)) {
      return externalFiles.getSnapshot(fileName)
    }

    if (manager.match(fileName)) {
      const snapshot = ts.ScriptSnapshot.fromString(manager.createContent(fileName))

      if (projectFiles) {
        projectFiles.set(fileName, snapshot)
      }

      return snapshot
    }

    const contents = ts.sys.readFile(fileName)

    if (contents === undefined) {
      return undefined
    }

    return ts.ScriptSnapshot.fromString(contents)
  }

export const getCustomTransformers =
  (manager: VirtualModuleManager) => (): ts.CustomTransformers => {
    return {
      before: [
        (context) => (sourceFile) => {
          const importer = sourceFile.fileName

          const visitNode = (node: ts.Node): ts.Node => {
            if (ts.isImportDeclaration(node)) {
              const specifier = removeQuotes(node.moduleSpecifier.getText())

              if (manager.match(specifier)) {
                return ts.factory.createImportDeclaration(
                  node.modifiers,
                  node.importClause,
                  ts.factory.createStringLiteral(
                    manager.resolveFileName({
                      id: specifier,
                      importer,
                    }),
                  ),
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

function removeQuotes(s: string): string {
  return s.replace(/"/g, '').replace(/'/g, '')
}
