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
    const workingDirectory = info.project.getCurrentDirectory()
    const tsConfigFilePath = getConfigPathForProject(info.project)

    if (!tsConfigFilePath) {
      throw new Error(`Cannot find TsConfig in ${workingDirectory} for ${tsConfigFilePath}`)
    }

    const config = readConfigFile(tsConfigFilePath)

    if (!config) {
      throw new Error(`Cannot read TsConfig file at ${tsConfigFilePath}`)
    }

    if (!config?.options) {
      config.options = {}
    }

    const typedOptions = readTypedOptions(config.raw)

    // Overrides for virtual modules
    config.options.inlineSources = true

    const manager = new VirtualModuleManager([ApiPlugin, BrowserPlugin] as const, (msg) =>
      info.project.log(`[@typed/virtual] ${msg}`),
    )
    const moduleResolutionCache = createModuleResolutionCache(workingDirectory, config.options)

    const resolveModuleNameLiterals = info.languageServiceHost.resolveModuleNameLiterals?.bind(
      info.languageServiceHost,
    )

    const createModuleResolver =
      (
        containingFile: string,
        options: ts.CompilerOptions,
        redirectedReference?: ts.ResolvedProjectReference,
      ) =>
      (moduleName: ts.StringLiteralLike) => {
        const name = moduleName.text

        if (manager.match(name)) {
          manager.log(`Resolving ${name} from ${containingFile}...`)

          const resolvedFileName = manager.resolveFileName({
            id: name,
            importer: containingFile,
          })

          const resolved: ts.ResolvedModuleWithFailedLookupLocations = {
            resolvedModule: {
              extension: ts.Extension.Ts,
              resolvedFileName,
              isExternalLibraryImport: !typedOptions.saveGeneratedFiles,
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
      }

    if (resolveModuleNameLiterals) {
      info.languageServiceHost.resolveModuleNameLiterals = (
        moduleNames,
        containingFile,
        redirectedReference,
        options,
        ...rest
      ) => {
        const resolver = createModuleResolver(containingFile, options, redirectedReference)

        return resolveModuleNameLiterals(
          moduleNames,
          containingFile,
          redirectedReference,
          options,
          ...rest,
        ).map((resolved, i) => {
          if (resolved.resolvedModule) {
            return resolved
          }

          return resolver(moduleNames[i])
        })
      }
    } else {
      info.languageServiceHost.resolveModuleNameLiterals = (
        moduleNames,
        containingFile,
        redirectedReference,
        options,
      ) => moduleNames.map(createModuleResolver(containingFile, options, redirectedReference))
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
        manager.log(`Generating snapshot for ${fileName}...`)

        let scriptInfo = info.project.projectService.getScriptInfo(fileName)
        let snapshot = scriptInfo?.getSnapshot()

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const content = manager.createContent(fileName, () => info.languageService.getProgram()!)

        if (snapshot) {
          const length = snapshot.getLength()
          const current = snapshot.getText(0, length)
          if (current !== content) {
            scriptInfo?.editContent(0, length, content)
          }
        } else {
          snapshot = ts.ScriptSnapshot.fromString(content)

          const normalizedFileName = ts.server.toNormalizedPath(fileName)
          scriptInfo = info.project.projectService.getOrCreateScriptInfoForNormalizedPath(
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
        }

        if (typedOptions.saveGeneratedFiles && scriptInfo) {
          scriptInfo.saveTo(fileName)
        }

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

function readTypedOptions(config: ts.ParsedCommandLine['raw']) {
  const typed = config['@typed/virtual']

  return {
    saveGeneratedFiles: typed.saveGeneratedFiles !== undefined ? !!typed.saveGeneratedFiles : false,
  }
}
