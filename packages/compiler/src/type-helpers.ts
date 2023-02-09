import { pipe } from '@fp-ts/core/Function'
import * as O from '@fp-ts/core/Option'
import { isLayoutFileName, isEnvironmentFileName, isFallbackFileName } from '@typed/framework'
import { SyntaxKind, type ExportedDeclarations, type SourceFile, type Type } from 'ts-morph'

import type { ApiSourceFileModule } from './ApiModuleTree.js'
import type { EnvironmentSourceFileModule, SourceFileModule } from './SourceFileModule.js'

export function parseSourceFileModule(sourceFile: SourceFile): O.Option<SourceFileModule> {
  const fileName = sourceFile.getFilePath()
  const exportedDeclarations = sourceFile.getExportedDeclarations()

  if (exportedDeclarations.size === 0) {
    return O.none()
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

export function parseLayoutSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const layout = getAndVerifyLayout(exportedDeclarations)
  const environment = getAndVerifyEnvironment(exportedDeclarations)

  if (O.isNone(layout)) {
    return O.none()
  }

  return O.some({ _tag: 'Layout', sourceFile, hasEnvironment: O.isSome(environment) })
}

export function parseFallbackSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  return pipe(
    parseRedirectFallbackSourceFileModule(sourceFile, exportedDeclarations),
    O.orElse(() => parseRenderableFallbackSourceFileModule(sourceFile, exportedDeclarations)),
  )
}

export function parseRedirectFallbackSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const route = getAndVerifyRoute(exportedDeclarations)
  const environment = getAndVerifyEnvironment(exportedDeclarations)

  if (O.isNone(route)) {
    return O.none()
  }

  return O.some({
    _tag: 'Redirect',
    sourceFile,
    hasParams: exportedDeclarations.has('params'),
    hasEnvironment: O.isSome(environment),
  })
}

export function parseRenderableFallbackSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<SourceFileModule> {
  const [fallback, isFx] = getAndVerifyFxOrFxReturning(exportedDeclarations, 'fallback')
  const environment = getAndVerifyEnvironment(exportedDeclarations)
  const layout = getAndVerifyLayout(exportedDeclarations)

  if (O.isNone(fallback)) {
    return O.none()
  }

  const hasLayout = O.isSome(layout)
  const hasEnvironment = O.isSome(environment)

  return O.some({ _tag: 'Fallback', sourceFile, isFx, hasLayout, hasEnvironment })
}

export function parseRenderSourceFileModule(
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
    return O.none()
  }

  const hasLayout = O.isSome(layout)
  const hasEnvironment = O.isSome(environment)
  const hasStaticPaths = O.isSome(staticPaths)

  return O.some({
    _tag: 'Render',
    sourceFile,
    route: parseRouteValue(route.value),
    isFx,
    hasLayout,
    hasEnvironment,
    hasStaticPaths,
  })
}

export function getAndVerifyRoute(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
) {
  return getDeclarationOfType(exportedDeclarations, typeIsRoute, 'route')
}

export function getAndVerifyFxOrFxReturning(
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

export function getAndVerifyLayout(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
) {
  return getDeclarationOfType(exportedDeclarations, typeIsFx, 'layout')
}

export function getAndVerifyEnvironment(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
) {
  return getDeclarationOfType(
    exportedDeclarations,
    (t) => typeIsLayer(t) || typeIsContext(t),
    'environment',
  )
}

export function getAndVerifyStaticPaths(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
) {
  return getDeclarationOfType(exportedDeclarations, typeIsEffect, 'getStaticPaths')
}

export function getDeclarationOfType(
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
  predicate: (type: Type, node: ExportedDeclarations) => boolean,
  exportName: string,
) {
  const declarations = exportedDeclarations.get(exportName)

  if (declarations === undefined) {
    return O.none()
  }

  const declaration = declarations.find(
    (x) => !x.isKind(SyntaxKind.InterfaceDeclaration) && !x.isKind(SyntaxKind.TypeAliasDeclaration),
  )

  if (!declaration) {
    return O.none()
  }

  const symbol = declaration.getSymbolOrThrow()
  const type = symbol.getTypeAtLocation(declaration)

  if (predicate(type, declaration)) {
    return O.some(declaration)
  }

  return O.none()
}

export function typeIsFx(type: Type) {
  return !!type.getProperty('run')
}

export function typeIsLayer(type: Type) {
  return type.getProperties().some((s) => {
    return s.getValueDeclarationOrThrow().getSourceFile().getFilePath().includes('@effect/io/Layer')
  })
}

export function typeIsContext(type: Type) {
  return !!type.getProperty('_id') && !!type.getProperty('_S')
}

export function typeIsRoute(type: Type) {
  return !!type.getProperty('path') && !!type.getProperty('make') && !!type.getProperty('match')
}

export function typeIsFxReturningFunction(type: Type) {
  const callSignatures = type.getCallSignatures()

  if (callSignatures.length === 0) {
    return false
  }

  return typeIsFx(callSignatures[0].getReturnType())
}

export function parseEnvironmentSourceFileModule(
  sourceFile: SourceFile,
  exportedDeclarations: ReadonlyMap<string, ExportedDeclarations[]>,
): O.Option<EnvironmentSourceFileModule> {
  const environment = getAndVerifyEnvironment(exportedDeclarations)

  if (O.isNone(environment)) {
    return O.none()
  }

  return O.some({ _tag: 'Environment', sourceFile })
}

export function parseApiSourceFile(
  sourceFile: SourceFile,
): O.Option<ApiSourceFileModule | EnvironmentSourceFileModule> {
  const filePath = sourceFile.getFilePath()
  const exportedDeclarations = sourceFile.getExportedDeclarations()

  if (exportedDeclarations.size === 0) {
    return O.none()
  }

  if (isEnvironmentFileName(filePath)) {
    return parseEnvironmentSourceFileModule(sourceFile, exportedDeclarations)
  }

  return parseApiModule(sourceFile, exportedDeclarations)
}

export function parseApiModule(
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

export function typeIsFetchHandler(type: Type, node: ExportedDeclarations) {
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

export function typeIsEffect(type: Type) {
  return type.getProperties().some((s) => {
    return s.getValueDeclarationOrThrow().getSourceFile().getFilePath().includes('@effect/io')
  })
}

export function parseRouteValue(route: ExportedDeclarations) {
  const typeArgs = route.getType().getTypeArguments()
  const pathArg = typeArgs[1]
  const path = pathArg.getText(route).replace(/['"]/g, '')

  return path
}
