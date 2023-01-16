import type { Project } from 'ts-morph'

import * as SFM from './SourceFileModule.js'
import type { Directory } from './readDirectory.js'
import { scanSourceFiles } from './scanSourceFiles.js'

export function readModules(
  project: Project,
  directory: Directory,
  inheritedLayout?: SFM.LayoutSourceFileModule,
  inheritedEnvironment?: SFM.EnvironmentSourceFileModule,
): ModuleTreeWithFallback {
  const sourceFileModules = scanSourceFiles(directory.files, project)
  const layouts = sourceFileModules.filter(SFM.isLayoutModule)
  const fallbacks = sourceFileModules.filter(
    (x): x is SFM.FallbackSourceFileModule | SFM.RedirectSourceFileModule =>
      SFM.isFallbackModule(x) || SFM.isRedirectModule(x),
  )
  const modules = sourceFileModules.filter(SFM.isRenderModule)
  const environments = sourceFileModules.filter(SFM.isEnvironmentModule)

  // Each directory can only have one layout and one fallback
  const errors = []

  if (layouts.length > 1) {
    errors.push(`Multiple layouts found in ${directory.directory}`)
  }

  if (fallbacks.length > 1) {
    errors.push(`Multiple fallbacks found in ${directory.directory}`)
  }

  if (environments.length > 1) {
    errors.push(`Multiple environments found in ${directory.directory}`)
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }

  const layout = layouts[0] || inheritedLayout
  const environment = environments[0] || inheritedEnvironment

  return {
    directory: directory.directory,
    layout,
    fallback: fallbacks[0],
    environment,
    modules,
    children: directory.directories.map((d) => readModules(project, d, layout, environment)),
  }
}

export interface ModuleTree {
  readonly directory: string
  readonly children: readonly ModuleTree[]
  readonly layout?: SFM.LayoutSourceFileModule
  readonly environment?: SFM.EnvironmentSourceFileModule
  readonly modules: readonly SFM.RenderSourceFileModule[]
}

export interface ModuleTreeWithFallback extends ModuleTree {
  readonly fallback?: SFM.FallbackSourceFileModule | SFM.RedirectSourceFileModule
}
