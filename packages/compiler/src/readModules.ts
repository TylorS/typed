import { Project } from 'ts-morph'

import * as SFM from './SourceFileModule.js'
import { Directory } from './readDirectory.js'
import { scanSourceFiles } from './scanSourceFiles.js'

export function readModules(project: Project, directory: Directory): ModuleTreeWithFallback {
  const sourceFileModules = scanSourceFiles(directory.files, project)
  const layouts = sourceFileModules.filter(SFM.isLayoutModule)
  const fallbacks = sourceFileModules.filter(
    (x): x is SFM.FallbackSourceFileModule | SFM.RedirectSourceFileModule =>
      SFM.isFallbackModule(x) || SFM.isRedirectModule(x),
  )
  const modules = sourceFileModules.filter(SFM.isRenderModule)

  // Each directory can only have one layout and one fallback
  const errors = []

  if (layouts.length > 1) {
    errors.push(`Multiple layouts found in ${directory.directory}`)
  }

  if (fallbacks.length > 1) {
    errors.push(`Multiple fallbacks found in ${directory.directory}`)
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }

  return {
    directory: directory.directory,
    layout: layouts[0],
    fallback: fallbacks[0],
    modules,
    children: directory.directories.map((d) => readModules(project, d)),
  }
}

export interface ModuleTree {
  readonly directory: string
  readonly children: readonly ModuleTree[]
  readonly layout?: SFM.LayoutSourceFileModule
  readonly modules?: readonly SFM.RenderSourceFileModule[]
}

export interface ModuleTreeWithFallback extends ModuleTree {
  readonly fallback?: SFM.FallbackSourceFileModule | SFM.RedirectSourceFileModule
}
