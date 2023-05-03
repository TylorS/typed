import { dirname, join } from 'path'

import ts from 'typescript'

import { findConfigFile, readConfigFile } from './config.js'
import { Service } from './service.js'
import { getCanonicalFileName } from './util.js'

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

  return service.openProject(config, (host, { projectFiles }) => {
    const moduleResolutionCache = ts.createModuleResolutionCache(
      host.getCurrentDirectory(),
      getCanonicalFileName,
      config.options,
    )

    // TODO: Extend the host to support custom resolution of virtual modules
    host.resolveModuleNameLiterals = (
      moduleNames,
      containingFile,
      redirectedReference,
      options,
    ) => {
      return moduleNames.map((moduleName) => {
        const name = moduleName.text

        if (name.startsWith('api:')) {
          const resolvedFileName = join(dirname(containingFile), createApiFileName(name))

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

    host.getScriptSnapshot = (fileName) => {
      // TODO: Extend with virtual modules

      if (fileName.includes('__generated__')) {
        const snapshot = ts.ScriptSnapshot
          .fromString(`import type { FetchHandler } from "@typed/framework/api";
import * as typedModule0 from "./api/hello.js";

export const handlers = [
    typedModule0.hello.provideSomeLayer(typedModule0.environment)
] as const
`)

        projectFiles.set(fileName, snapshot)

        return snapshot
      }

      return ts.ScriptSnapshot.fromString(ts.sys.readFile(fileName) ?? '')
    }

    host.getCustomTransformers = (): ts.CustomTransformers => {
      return {
        before: [
          (context) => (sourceFile) => {
            const visitNode = (node: ts.Node): ts.Node => {
              if (ts.isImportDeclaration(node)) {
                const specifier = removeQuotes(node.moduleSpecifier.getText())

                if (specifier.startsWith('api:')) {
                  return ts.factory.createImportDeclaration(
                    node.modifiers,
                    node.importClause,
                    // TODO: Resolve the specifier to a virtual module
                    ts.factory.createStringLiteral(createApiFileName(specifier, 'js')),
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
  })
}

function removeQuotes(s: string): string {
  return s.replace(/"/g, '').replace(/'/g, '')
}

function createApiFileName(name: string, extension = 'ts') {
  return `${name.slice(4)}.api.__generated__.${extension}`
}
