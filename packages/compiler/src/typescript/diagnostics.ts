/**
 * @since 1.0.0
 */

import ts from "typescript"
import { getCanonicalFileName, getNewLine } from "./util.js"

/**
 * @since 1.0.0
 */
export type DiagnosticWriter = {
  /**
   * @since 1.0.0
   */
  format: (diagnostic: ts.Diagnostic) => string
  /**
   * @since 1.0.0
   */
  print: (diagnostic: ts.Diagnostic) => void
}

/**
 * @since 1.0.0
 */
export function createDiagnosticWriter(
  write?: (message: string) => void
): DiagnosticWriter {
  const writeDiagnostic = write ?? ts.sys.write

  const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName,
    getNewLine
  }

  function format(diagnostic: ts.Diagnostic): string {
    return ts.formatDiagnosticsWithColorAndContext(
      Array.isArray(diagnostic) ? diagnostic : [diagnostic],
      formatDiagnosticsHost
    )
  }

  function print(diagnostic: ts.Diagnostic) {
    const message = format(diagnostic)
    writeDiagnostic(message)
  }

  return {
    format,
    print
  }
}
