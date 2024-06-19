/**
 * @since 1.0.0
 */

import ts from "typescript"

/**
 * @since 1.0.0
 */
export function getCanonicalFileName(fileName: string): string {
  return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()
}

/**
 * @since 1.0.0
 */
export function getNewLine(): string {
  return ts.sys.newLine
}
