import ts from 'typescript'

import { ExternalFileCache, ProjectFileCache } from './cache.js'
import { createDiagnosticWriter } from './diagnostics.js'
import { Project } from './project.js'

export class Service {
  private documentRegistry
  private diagnosticWriter

  constructor(write?: (message: string) => void) {
    this.documentRegistry = ts.createDocumentRegistry()
    this.diagnosticWriter = createDiagnosticWriter(write)
  }

  openProject(
    cmdLine: ts.ParsedCommandLine,
    enhanceLanguageServiceHost?: (
      host: ts.LanguageServiceHost,
      files: {
        readonly projectFiles: ProjectFileCache
        readonly externalFiles: ExternalFileCache
      },
    ) => void,
  ): Project {
    return new Project(
      this.documentRegistry,
      this.diagnosticWriter,
      cmdLine,
      enhanceLanguageServiceHost,
    )
  }
}
