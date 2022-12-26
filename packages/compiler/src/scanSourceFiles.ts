import { pipe } from '@fp-ts/data/Function'
import * as O from '@fp-ts/data/Option'
import { pathCardinality, isFallbackFileName, isLayoutFileName } from '@typed/framework'
import { ExportedDeclarations, Project, SourceFile, Type } from 'ts-morph'

import { SourceFileModule } from './SourceFileModule.js'

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
    const sourceFileModule = parseSourceFileModule(sourceFile)

    if (O.isNone(sourceFileModule)) {
      console.log(`Unable to parse information from ${sourceFile.getFilePath()}`)

      continue
    }

    sourceFileModules.push(sourceFileModule.value)
  }

  return sourceFileModules
}

export function parseSourceFileModule(sourceFile: SourceFile): O.Option<SourceFileModule> {
  const fileName = sourceFile.getFilePath()
  const exportedDeclarations = sourceFile.getExportedDeclarations()

  if (exportedDeclarations.size === 0) {
    return O.none
  }

  if (isLayoutFileName(fileName)) {
    return parseLayoutSourceFileModule(sourceFile, exportedDeclarations)
  } else if (isFallbackFileName(fileName)) {
    return parseFallbackSourceFileModule(sourceFile, exportedDeclarations)
  }

  return parseRenderSourceFileModule(sourceFile, exportedDeclarations)
}

function parseLayoutSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const layout = getAndVerifyLayout(sourceFile, exportedDeclarations)
  const environment = getAndVerifyEnvironment(sourceFile, exportedDeclarations, 'layout')

  if (O.isNone(layout)) {
    return O.none
  }

  return pipe(
    environment,
    O.match(
      () => O.some({ _tag: 'Layout/Basic', sourceFile }),
      () => O.some({ _tag: 'Layout/Environment', sourceFile }),
    ),
  )
}

function parseFallbackSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  return pipe(
    parseRedirectFallbackSourceFileModule(sourceFile, exportedDeclarations),
    O.catchAll(() => parseRenderableFallbackSourceFileModule(sourceFile, exportedDeclarations)),
  )
}

function parseRedirectFallbackSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const route = getAndVerifyRoute(sourceFile, exportedDeclarations, 'route redirect')
  const environment = getAndVerifyEnvironment(sourceFile, exportedDeclarations, 'route redirect')

  if (O.isNone(route)) {
    return O.none
  }

  if (O.isNone(environment)) {
    return O.some({ _tag: 'Redirect/Basic', sourceFile })
  }

  return O.some({ _tag: 'Redirect/Environment', sourceFile })
}

function parseRenderableFallbackSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const [fallback, isFx] = getAndVerifyFxOrFxReturning(
    sourceFile,
    exportedDeclarations,
    'fallback',
    'renderable fallback',
  )
  const environment = getAndVerifyEnvironment(
    sourceFile,
    exportedDeclarations,
    'renderable fallback',
  )

  if (O.isNone(fallback)) {
    return O.none
  }

  if (O.isNone(environment)) {
    return O.some({ _tag: 'Fallback/Basic', sourceFile, isFx })
  }

  return O.some({ _tag: 'Fallback/Environment', sourceFile, isFx })
}

function parseRenderSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const route = getAndVerifyRoute(sourceFile, exportedDeclarations, 'renderable')
  const [main, isFx] = getAndVerifyFxOrFxReturning(
    sourceFile,
    exportedDeclarations,
    'main',
    'renderable',
  )
  const environment = getAndVerifyEnvironment(sourceFile, exportedDeclarations, 'renderable')
  const layout = getAndVerifyLayout(sourceFile, exportedDeclarations)

  if (O.isNone(route) || O.isNone(main)) {
    return O.none
  }

  if (O.isNone(environment)) {
    return O.some({ _tag: 'Render/Basic', sourceFile, isFx, hasLayout: O.isSome(layout) })
  }

  return O.some({ _tag: 'Render/Environment', sourceFile, isFx, hasLayout: O.isSome(layout) })
}

function getAndVerifyRoute(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
  typeOfFile: string,
) {
  return getDeclarationOfType(sourceFile, exportedDeclarations, typeIsRoute, 'route', typeOfFile)
}

function getAndVerifyFxOrFxReturning(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
  exportName: string,
  typeOfFile: string,
) {
  let isFx = false

  return [
    getDeclarationOfType(
      sourceFile,
      exportedDeclarations,
      (t) => (isFx = typeIsFx(t)) || typeIsFxReturningFunction(t),
      exportName,
      typeOfFile,
    ),
    isFx,
  ] as const
}

function getAndVerifyLayout(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
) {
  return getDeclarationOfType(sourceFile, exportedDeclarations, typeIsFx, 'layout', 'layout')
}

function getAndVerifyEnvironment(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
  typeOfFile: string,
) {
  return getDeclarationOfType(
    sourceFile,
    exportedDeclarations,
    (t) => typeIsLayer(t) || typeIsContext(t),
    'environment',
    typeOfFile,
  )
}

function getDeclarationOfType(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
  predicate: (type: Type) => boolean,
  exportName: string,
  typeOfFile: string,
) {
  const declarations = exportedDeclarations.get(exportName)

  if (declarations === undefined) {
    return O.none
  }

  if (declarations.length > 1) {
    console.warn(`Multiple declarations for ${exportName} found in ${typeOfFile} file: ${sourceFile.getFilePath()}.
      Using the first declaration.`)
  }

  const symbol = declarations[0].getSymbolOrThrow()
  const type = symbol.getTypeAtLocation(declarations[0])

  if (predicate(type)) {
    return O.some(declarations[0])
  }

  return O.none
}

// TODO: Verify function parameters
// TODO: Verify function return types
// TODO: Verify types match FileSystemModules

function typeIsFx(type: Type) {
  // TODO: Needs drastic improvements
  return !!type.getProperty('run')
}

function typeIsLayer(type: Type) {
  // TODO: Needs drastic improvements
  return !!type.getProperty('build')
}

function typeIsContext(type: Type) {
  // TODO: Needs drastic improvements
  return !!type.getProperty('_id') && !!type.getProperty('_S')
}

function typeIsRoute(type: Type) {
  // TODO: Needs drastic improvements
  return !!type.getProperty('path') && !!type.getProperty('make') && !!type.getProperty('match')
}

function typeIsFxReturningFunction(type: Type) {
  const callSignatures = type.getCallSignatures()

  if (callSignatures.length === 0) {
    return false
  }

  return typeIsFx(callSignatures[0].getReturnType())
}
