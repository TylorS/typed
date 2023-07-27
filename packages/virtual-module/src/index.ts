import ts from 'typescript/lib/tsserverlibrary'

import * as VM from './api.js'

// TODO: Manage file-watchers to update virtual modules when their underlying files change

const plugin: ts.server.PluginModuleFactory = ({ typescript }) => {
  return {
    create,
  }

  function create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    const workingDirectory = info.project.getCurrentDirectory()
    const tsConfigFilePath = VM.getConfigPathForProject(info.project)

    if (!tsConfigFilePath) {
      throw new Error(`Cannot find TsConfig in ${workingDirectory} for ${tsConfigFilePath}`)
    }

    const config = VM.readConfigFile(tsConfigFilePath)

    if (!config) {
      throw new Error(`Cannot read TsConfig file at ${tsConfigFilePath}`)
    }

    if (!config?.options) {
      config.options = {}
    }

    const typedOptions = VM.resolveTypedOptions(config.raw)

    // If we don't have any configured plugins, just return the language service as is
    if (typedOptions.plugins.length === 0) {
      return info.languageService
    }

    // Overrides for virtual modules
    config.options.inlineSources = true

    const plugins = typedOptions.plugins.map(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      (plugin) => require(plugin.name) as VM.VirtualModulePlugin<any>,
    )

    const pluginParams = Object.fromEntries(
      typedOptions.plugins.map(({ name, ...config }) => [name, config] as const),
    )

    const manager = new VM.VirtualModuleManager(
      plugins,
      pluginParams,
      () => info.languageService,
      (msg) => info.project.log(`[@typed/virtual] ${msg}`),
    )

    const host = VM.patchLanguageServiceHost({
      cmdLine: config,
      host: info.languageServiceHost,
      manager,
      workingDirectory,
      saveGeneratedFiles: typedOptions.saveGeneratedFiles ?? false,
      options: config.options,
    })

    const virtualSys = VM.makeVirtualSys(typescript.sys, manager)

    const getScriptSnapshot = info.languageServiceHost.getScriptSnapshot!.bind(
      info.languageServiceHost,
    )

    // Further patch getScriptSnapshot to attach script info to the project
    host.getScriptSnapshot = (fileName: string) => {
      if (manager.hasFileName(fileName)) {
        manager.log(`Generating snapshot for ${fileName}...`)

        let scriptInfo = info.project.projectService.getScriptInfo(fileName)
        const snapshot = manager.generateSnapshot(fileName)

        // On creation we need to attach the script info to the project
        if (snapshot.getScriptVersion() === '0') {
          const normalizedFileName = ts.server.toNormalizedPath(fileName)
          scriptInfo = info.project.projectService.getOrCreateScriptInfoForNormalizedPath(
            normalizedFileName,
            true,
            snapshot.getContent(),
            snapshot.getScriptKind(),
            false,
            {
              fileExists: (path) =>
                path === fileName || path === normalizedFileName || virtualSys.fileExists(path),
            },
          )
          scriptInfo?.attachToProject(info.project)
        }

        if (typedOptions.saveGeneratedFiles && scriptInfo) {
          scriptInfo.saveTo(fileName)
        }
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

export = plugin
