import ts from 'typescript/lib/tsserverlibrary'

import { ExternalFileCache, ProjectFileCache, createModuleResolutionCache } from './cache.js'
import { getScriptSnapshot, resolveModuleNameLiterals } from './host.js'

export const plugin: ts.server.PluginModuleFactory = () => {
  // Setup state
  let projectFiles: ProjectFileCache
  let externalFiles: ExternalFileCache

  // Return our plugin
  return {
    create,
    getExternalFiles,
  }

  // Extend the language service host
  function create(info: ts.server.PluginCreateInfo) {
    projectFiles = new ProjectFileCache(info.project.getFileNames(), info)
    externalFiles = new ExternalFileCache()

    const host = info.languageServiceHost
    const moduleResolutionCache = createModuleResolutionCache(
      host.getCurrentDirectory(),
      host.getCompilationSettings(),
    )

    host.getScriptFileNames = () => Array.from(projectFiles.getFileNames())
    host.getScriptVersion = (fileName) => projectFiles.getVersion(fileName) ?? '0'
    // Extend the host
    host.resolveModuleNameLiterals = resolveModuleNameLiterals(host, moduleResolutionCache)
    host.getScriptSnapshot = getScriptSnapshot(projectFiles, externalFiles)

    return info.languageService
  }

  // Return the files that are in our project
  function getExternalFiles() {
    return Array.from(projectFiles.getFileNames())
  }
}
