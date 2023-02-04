import * as O from '@fp-ts/core/Option'
import { pathCardinality } from '@typed/framework'
import type { Project } from 'ts-morph'

import type { SourceFileModule } from './SourceFileModule.js'
import { parseSourceFileModule } from './type-helpers.js'

/**
 * Scans over the source files and returns the inferred type of FileSystemModule it
 * is with the SourceFile itself.
 */
export function scanSourceFiles(fileGlobs: readonly string[], project: Project) {
  const sourceFileModules: Array<SourceFileModule> = []
  const sourceFiles = project
    .addSourceFilesAtPaths(fileGlobs)
    .sort((a, b) => pathCardinality(a.getFilePath(), b.getFilePath()))

  for (const sourceFile of sourceFiles) {
    // This parsing is very minimal and only checks for the existence of a few
    // properties. It is not meant to be a full type checker. It is meant to
    // provide a quick way to determine the type of module a file is and to
    // provide a way to get the SourceFile for the module to be utilized by other processes.
    // Type-checking will be done once the entry point is built.
    const sourceFileModule = parseSourceFileModule(sourceFile)

    if (O.isNone(sourceFileModule)) {
      continue
    }

    sourceFileModules.push(sourceFileModule.value)
  }

  return sourceFileModules
}
