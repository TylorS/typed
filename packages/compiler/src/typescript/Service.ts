import ts from "typescript"
import { createDiagnosticWriter, type DiagnosticWriter } from "./diagnostics.js"
import { Project } from "./Project.js"

export class Service {
  readonly documentRegistry: ts.DocumentRegistry
  readonly diagnosticWriter: DiagnosticWriter

  constructor(write?: (message: string) => void) {
    this.documentRegistry = ts.createDocumentRegistry()
    this.diagnosticWriter = createDiagnosticWriter(write)
  }

  openProject(
    cmdLine: ts.ParsedCommandLine,
    enhanceLanguageServiceHost?: (host: ts.LanguageServiceHost) => void
  ): Project {
    return new Project(
      this.documentRegistry,
      this.diagnosticWriter,
      cmdLine,
      enhanceLanguageServiceHost
    )
  }
}
