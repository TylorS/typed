/**
 * @since 1.0.0
 */
import ts from "typescript"
import { createDiagnosticWriter, type DiagnosticWriter } from "./diagnostics.js"
import { Project } from "./Project.js"

/**
 * @since 1.0.0
 */
export class Service {
  /**
   * @since 1.0.0
   */
  readonly documentRegistry: ts.DocumentRegistry
  /**
   * @since 1.0.0
   */
  readonly diagnosticWriter: DiagnosticWriter

  constructor(write?: (message: string) => void) {
    this.documentRegistry = ts.createDocumentRegistry()
    this.diagnosticWriter = createDiagnosticWriter(write)
  }

  /**
   * @since 1.0.0
   */
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
