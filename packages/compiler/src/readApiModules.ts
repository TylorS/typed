import type { Project } from 'ts-morph'

import type { ApiModuleTree, ApiSourceFileModule } from './ApiModuleTree.js'
import type * as SFM from './SourceFileModule.js'
import type { Directory } from './readDirectory.js'
import { scanApiSourceFiles } from './scanApiSourceFiles.js'

export function readApiModules(
  project: Project,
  directory: Directory,
  inheritedEnvironment?: SFM.EnvironmentSourceFileModule,
): ApiModuleTree {
  const modules = scanApiSourceFiles(directory.files, project)
  const apiModules = modules.filter(isApiModule)
  const environments = modules.filter(isEnvironmentModule)
  const errors: string[] = []

  if (environments.length > 1) {
    errors.push(`Multiple environments found in ${directory.directory}`)
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }

  const environment = environments[0] || inheritedEnvironment

  return {
    directory: directory.directory,
    modules: apiModules,
    environment,
    children: directory.directories.map((d) => readApiModules(project, d, environment)),
  }
}

function isApiModule(
  x: SFM.EnvironmentSourceFileModule | ApiSourceFileModule,
): x is ApiSourceFileModule {
  return x._tag === 'Api'
}

function isEnvironmentModule(
  x: SFM.EnvironmentSourceFileModule | ApiSourceFileModule,
): x is SFM.EnvironmentSourceFileModule {
  return x._tag === 'Environment'
}
