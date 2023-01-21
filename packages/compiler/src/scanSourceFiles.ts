import { pipe } from '@fp-ts/data/Function'
import * as O from '@fp-ts/data/Option'
import {
  pathCardinality,
  isFallbackFileName,
  isLayoutFileName,
  isEnvironmentFileName,
} from '@typed/framework'
import {
  SyntaxKind,
  type ExportedDeclarations,
  type Project,
  type SourceFile,
  type Type,
} from 'ts-morph'

import type { ApiSourceFileModule } from './ApiModuleTree.js'
import type { EnvironmentSourceFileModule, SourceFileModule } from './SourceFileModule.js'

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
  } else if (isEnvironmentFileName(fileName)) {
    return parseEnvironmentSourceFileModule(sourceFile, exportedDeclarations)
  }

  return parseRenderSourceFileModule(sourceFile, exportedDeclarations)
}

function parseLayoutSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const layout = getAndVerifyLayout(exportedDeclarations)
  const environment = getAndVerifyEnvironment(exportedDeclarations)

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
  const route = getAndVerifyRoute(exportedDeclarations)
  const environment = getAndVerifyEnvironment(exportedDeclarations)

  if (O.isNone(route)) {
    return O.none
  }

  if (O.isNone(environment)) {
    return O.some({
      _tag: 'Redirect/Basic',
      sourceFile,
      hasParams: exportedDeclarations.has('params'),
    })
  }

  return O.some({
    _tag: 'Redirect/Environment',
    sourceFile,
    hasParams: exportedDeclarations.has('params'),
  })
}

function parseRenderableFallbackSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const [fallback, isFx] = getAndVerifyFxOrFxReturning(exportedDeclarations, 'fallback')
  const environment = getAndVerifyEnvironment(exportedDeclarations)
  const layout = getAndVerifyLayout(exportedDeclarations)

  if (O.isNone(fallback)) {
    return O.none
  }

  const hasLayout = O.isSome(layout)

  if (O.isNone(environment)) {
    return O.some({ _tag: 'Fallback/Basic', sourceFile, isFx, hasLayout })
  }

  return O.some({ _tag: 'Fallback/Environment', sourceFile, isFx, hasLayout })
}

function parseRenderSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const route = getAndVerifyRoute(exportedDeclarations)
  const [main, isFx] = getAndVerifyFxOrFxReturning(exportedDeclarations, 'main')
  const environment = getAndVerifyEnvironment(exportedDeclarations)
  const layout = getAndVerifyLayout(exportedDeclarations)
  const staticPaths = getAndVerifyStaticPaths(exportedDeclarations)

  // Required exports
  if (O.isNone(route) || O.isNone(main)) {
    return O.none
  }

  const hasLayout = O.isSome(layout)
  const hasEnvironment = O.isSome(environment)
  const hasStaticPaths = O.isSome(staticPaths)

  return O.some({
    _tag: 'Render',
    sourceFile,
    isFx,
    hasLayout,
    hasEnvironment,
    hasStaticPaths,
  })
}

function getAndVerifyRoute(exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>) {
  return getDeclarationOfType(exportedDeclarations, typeIsRoute, 'route')
}

function getAndVerifyFxOrFxReturning(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
  exportName: string,
) {
  let isFx = false

  return [
    getDeclarationOfType(
      exportedDeclarations,
      (t) => (isFx = typeIsFx(t)) || typeIsFxReturningFunction(t),
      exportName,
    ),
    isFx,
  ] as const
}

function getAndVerifyLayout(exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>) {
  return getDeclarationOfType(exportedDeclarations, typeIsFx, 'layout')
}

function getAndVerifyEnvironment(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
) {
  return getDeclarationOfType(
    exportedDeclarations,
    (t) => typeIsLayer(t) || typeIsContext(t),
    'environment',
  )
}

function getAndVerifyStaticPaths(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
) {
  return getDeclarationOfType(exportedDeclarations, typeIsEffect, 'getStaticPaths')
}

function getDeclarationOfType(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
  predicate: (type: Type, node: ExportedDeclarations) => boolean,
  exportName: string,
) {
  const declarations = exportedDeclarations.get(exportName)

  if (declarations === undefined) {
    return O.none
  }

  const declaration = declarations.find(
    (x) => !x.isKind(SyntaxKind.InterfaceDeclaration) && !x.isKind(SyntaxKind.TypeAliasDeclaration),
  )

  if (!declaration) {
    return O.none
  }

  const symbol = declaration.getSymbolOrThrow()
  const type = symbol.getTypeAtLocation(declaration)

  if (predicate(type, declaration)) {
    return O.some(declaration)
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

function parseEnvironmentSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<EnvironmentSourceFileModule> {
  const environment = getAndVerifyEnvironment(exportedDeclarations)

  if (O.isNone(environment)) {
    return O.none
  }

  return O.some({ _tag: 'Environment', sourceFile })
}

export function scanApiSourceFiles(
  fileGlobs: readonly string[],
  project: Project,
): ReadonlyArray<ApiSourceFileModule | EnvironmentSourceFileModule> {
  const apiModules: Array<ApiSourceFileModule | EnvironmentSourceFileModule> = []
  const sourceFiles = project
    .getSourceFiles(fileGlobs)
    .sort((a, b) => pathCardinality(a.getFilePath(), b.getFilePath()))

  for (const sourceFile of sourceFiles) {
    const apiModule = parseApiSourceFile(sourceFile)

    if (O.isNone(apiModule)) {
      continue
    }

    apiModules.push(apiModule.value)
  }

  return apiModules
}

function parseApiSourceFile(
  sourceFile: SourceFile,
): O.Option<ApiSourceFileModule | EnvironmentSourceFileModule> {
  const filePath = sourceFile.getFilePath()
  const exportedDeclarations = sourceFile.getExportedDeclarations()

  if (exportedDeclarations.size === 0) {
    return O.none
  }

  if (isEnvironmentFileName(filePath)) {
    return parseEnvironmentSourceFileModule(sourceFile, exportedDeclarations)
  }

  return parseApiModule(sourceFile, exportedDeclarations)
}

function parseApiModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<ApiSourceFileModule> {
  const environment = getAndVerifyEnvironment(exportedDeclarations)
  const handlerExportNames: string[] = []

  for (const exportName of exportedDeclarations.keys()) {
    if (exportName === 'environment') {
      continue
    }

    const handler = getDeclarationOfType(exportedDeclarations, typeIsFetchHandler, exportName)

    if (O.isNone(handler)) {
      continue
    }

    handlerExportNames.push(exportName)
  }

  return O.some({
    _tag: 'Api',
    sourceFile,
    handlerExportNames: handlerExportNames.sort(),
    hasEnvironment: O.isSome(environment),
  })
}

function typeIsFetchHandler(type: Type, node: ExportedDeclarations) {
  const route = type.getProperty('route')?.getTypeAtLocation(node)
  const handler = type.getProperty('handler')

  return !!(
    route &&
    typeIsRoute(route) &&
    handler &&
    handler.getTypeAtLocation(node).getCallSignatures().length > 0 &&
    type.getProperty('httpMethods')
  )
}

function typeIsEffect(type: Type) {
  return type.getProperties().some((s) => {
    return s.getValueDeclarationOrThrow().getSourceFile().getFilePath().includes('@effect/io')
  })
}
