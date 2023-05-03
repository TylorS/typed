import ts from 'typescript'

export function getCanonicalFileName(fileName: string): string {
  return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()
}

export function getNewLine(): string {
  return ts.sys.newLine
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}
