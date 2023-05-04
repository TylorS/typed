import ts from 'typescript'

import { createDiagnosticWriter } from './diagnostics'
import { Project } from './project'
import { EnhanceProject } from './types'

class Service {
  protected documentRegistry
  protected diagnosticWriter

  constructor(write?: (message: string) => void) {
    this.documentRegistry = ts.createDocumentRegistry()
    this.diagnosticWriter = createDiagnosticWriter(write)
  }

  openProject(cmdLine: ts.ParsedCommandLine, enhanceLanguageServiceHost?: EnhanceProject): Project {
    return new Project(
      this.documentRegistry,
      this.diagnosticWriter,
      cmdLine,
      enhanceLanguageServiceHost,
    )
  }
}

export { Service }
