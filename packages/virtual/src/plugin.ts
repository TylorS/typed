import ts from 'typescript/lib/tsserverlibrary'

import { createModuleResolutionCache } from './cache'
import { readConfigFile } from './config'
import { ApiPlugin } from './plugins/api'
import { BrowserPlugin } from './plugins/browser'
import { getConfigPathForProject, getModuleResolutionKind } from './util'
import { VirtualModuleManager } from './virtual-module-manager'

export const plugin: ts.server.PluginModuleFactory = () => {
  // Return our plugin
  return {
    create,
  }

  // Extend the language service host
  function create(info: ts.server.PluginCreateInfo) {
    const tsConfigPath = info.config.tsConfigPath ?? 'tsconfig.json'
    const workingDirectory = info.project.getCurrentDirectory()
    const tsConfigFilePath = getConfigPathForProject(info.project)

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

    const manager = new VirtualModuleManager([ApiPlugin, BrowserPlugin] as const, (msg) =>
      info.project.log(msg),
    )
    const moduleResolutionCache = createModuleResolutionCache(workingDirectory, config.options)

    info.languageServiceHost.resolveModuleNameLiterals = (
      moduleNames,
      containingFile,
      redirectedReference,
      options,
    ) => {
      return moduleNames.map((moduleName) => {
        const name = moduleName.text

        if (manager.match(name)) {
          manager.log(`[@typed/virtual] Resolving ${name} from ${containingFile}...`)

          const resolvedFileName = manager.resolveFileName({
            id: name,
            importer: containingFile,
          })

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
          info.languageServiceHost,
          moduleResolutionCache,
          redirectedReference,
          getModuleResolutionKind(config.options),
        )
      })
    }

    const getScriptKind = info.languageServiceHost.getScriptKind?.bind(info.languageServiceHost)

    info.languageServiceHost.getScriptKind = (fileName) => {
      if (manager.hasFileName(fileName)) {
        return ts.ScriptKind.TS
      }

      return getScriptKind?.(fileName) ?? ts.ScriptKind.Unknown
    }

    const getScriptSnapshot = info.languageServiceHost.getScriptSnapshot?.bind(
      info.languageServiceHost,
    )

    info.languageServiceHost.getScriptSnapshot = (fileName) => {
      if (manager.hasFileName(fileName)) {
        manager.log(`[@typed/virtual] Generating snapshot for ${fileName}...`)

        const content = manager.createContent(fileName)
        const snapshot = ts.ScriptSnapshot.fromString(content)
        const normalizedFileName = ts.server.toNormalizedPath(fileName)
        const scriptInfo = info.project.projectService.getOrCreateScriptInfoForNormalizedPath(
          normalizedFileName,
          true,
          content,
          ts.ScriptKind.TS,
          false,
          {
            fileExists: (path) =>
              path === fileName || path === normalizedFileName || ts.sys.fileExists(path),
          },
        )

        scriptInfo?.attachToProject(info.project)

        return snapshot
      }

      const tsSnapshot = getScriptSnapshot?.(fileName)

      if (tsSnapshot) {
        return tsSnapshot
      }

      const content = ts.sys.readFile(fileName)

      if (content) {
        return ts.ScriptSnapshot.fromString(content)
      }

      return undefined
    }

    return info.languageService
  }
}
