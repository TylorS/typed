import { findConfigFile, readConfigFile } from './config'
import { getCustomTransformers, patchLanguageServiceHost } from './host'
import { ApiPlugin } from './plugins/api'
import { BrowserPlugin } from './plugins/browser'
import { Service } from './service'

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
    const manager = patchLanguageServiceHost(
      workingDirectory,
      config,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      () => project.languageService.getProgram()!,
      project.languageServiceHost,
      [ApiPlugin, BrowserPlugin],
      {
        projectFiles: project.projectFiles,
        externalFiles: project.externalFiles,
      },
    )

    const getCustomTransformersTs = project.languageServiceHost.getCustomTransformers
    const getCustomTransformersVirtual = getCustomTransformers(manager)

    project.languageServiceHost.getCustomTransformers = () => {
      const ts = getCustomTransformersTs?.() ?? {}
      const virtual = getCustomTransformersVirtual()

      return {
        before: [...(ts.before ?? []), ...(virtual.before ?? [])],
        after: [...(ts.after ?? []), ...(virtual.after ?? [])],
        afterDeclarations: [...(ts.afterDeclarations ?? []), ...(virtual.afterDeclarations ?? [])],
      }
    }
  })
}
