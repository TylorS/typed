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
    // This parsing is very minimal and only checks for the existence of a few
    // properties. It is not meant to be a full type checker. It is meant to
    // provide a quick way to determine the type of module a file is and to
    // provide a way to get the SourceFile for the module to be utilized by other processes.
    // Type-checking will be done once the entry point is built.
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

  const isNested = isNestedLayout(exportedDeclarations)

  return pipe(
    environment,
    O.match(
      () => O.some({ _tag: 'Layout/Basic', sourceFile, isNested }),
      () => O.some({ _tag: 'Layout/Environment', sourceFile, isNested }),
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
  const layout = getAndVerifyLayout(sourceFile, exportedDeclarations)

  if (O.isNone(fallback)) {
    return O.none
  }

  const hasLayout = O.isSome(layout)
  const isNested = hasLayout ? isNestedLayout(exportedDeclarations) : false

  if (O.isNone(environment)) {
    return O.some({ _tag: 'Fallback/Basic', sourceFile, isFx, hasLayout, isNested })
  }

  return O.some({ _tag: 'Fallback/Environment', sourceFile, isFx, hasLayout, isNested })
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

  const hasLayout = O.isSome(layout)
  const isNested = hasLayout ? isNestedLayout(exportedDeclarations) : false

  if (O.isNone(environment)) {
    return O.some({ _tag: 'Render/Basic', sourceFile, isFx, hasLayout, isNested })
  }

  return O.some({ _tag: 'Render/Environment', sourceFile, isFx, hasLayout, isNested })
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

function typeIsFx(type: Type) {
  // TODO: Needs drastic improvements
  return !!type.getProperty('run')
}

function typeIsLayer(type: Type) {
  return type.getProperties().some((s) => {
    return s.getValueDeclarationOrThrow().getSourceFile().getFilePath().includes('@effect/io/Layer')
  })
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

function isNestedLayout(exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>) {
  const declarations = exportedDeclarations.get('nested')

  if (declarations === undefined || declarations.length === 0) {
    return false
  }

  return declarations[0].getFullText().includes('true')
}
