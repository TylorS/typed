import * as O from '@effect/data/Option'
import { pathCardinality } from '@typed/framework'
import type { Project } from 'ts-morph'

import type { ApiSourceFileModule } from './ApiModuleTree.js'
import type { EnvironmentSourceFileModule } from './SourceFileModule.js'
import { parseApiSourceFile } from './type-helpers.js'

export function scanApiSourceFiles(
  fileGlobs: readonly string[],
  project: Project,
): ReadonlyArray<ApiSourceFileModule | EnvironmentSourceFileModule> {
  const apiModules: Array<ApiSourceFileModule | EnvironmentSourceFileModule> = []
  const sourceFiles = project
    .getSourceFiles(fileGlobs)
    .sort((a, b) => pathCardinality(a.getFilePath(), b.getFilePath()))

  for (const sourceFile of sourceFiles) {
    const apiModule = parseApiSourceFile(sourceFile)

    if (O.isNone(apiModule)) {
      continue
    }

    apiModules.push(apiModule.value)
  }

  return apiModules
}
