import fs from 'fs'
import { dirname, join, relative } from 'path'

import { left, right } from '@effect/data/Either'
import * as RA from '@effect/data/ReadonlyArray'
import ts from 'typescript/lib/tsserverlibrary'

export function getCanonicalFileName(fileName: string): string {
  return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase()
}

export function getNewLine(): string {
  return ts.sys.newLine
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}

export function readDirectory(directory: string): Directory {
  const stat = fs.statSync(directory)

  if (stat.isFile()) {
    return {
      directory: dirname(directory),
      files: [directory],
      directories: [],
    }
  }

  const paths = fs.readdirSync(directory)
  const [files, directories] = RA.separate(
    paths.map((p) => {
      const filePath = join(directory, p)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        return right(filePath)
      }

      return left(filePath)
    }),
  )

  return {
    directory,
    files,
    directories: directories.map(readDirectory),
  }
}

export interface Directory {
  readonly directory: string
  readonly files: readonly string[]
  readonly directories: readonly Directory[]
}

export function removeQuotes(s: string): string {
  return s.replace(/"/g, '').replace(/'/g, '')
}

export function ensureRelative(from: string, to: string): string {
  const rel = relative(from, to)

  if (rel.startsWith('.')) {
    return rel
  }

  return `./${rel}`
}

export function getConfigPathForProject(project: ts.server.Project) {
  return (
    (project as ts.server.ConfiguredProject).canonicalConfigFilePath ??
    (project.getCompilerOptions() as any).configFilePath
  )
}

export function getModuleResolutionKind(options: ts.CompilerOptions): ts.ResolutionMode {
  switch (options.moduleResolution) {
    case ts.ModuleResolutionKind.NodeJs:
      return ts.ModuleKind.CommonJS
    case ts.ModuleResolutionKind.Bundler:
    case ts.ModuleResolutionKind.Node16:
    case ts.ModuleResolutionKind.NodeNext:
      return ts.ModuleKind.ESNext
  }
}
