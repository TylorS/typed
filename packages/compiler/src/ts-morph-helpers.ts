import { EOL } from 'os'

import { ImportDeclaration, SourceFile } from 'ts-morph'

const importDeclarationsMap = new WeakMap<SourceFile, Map<string, ImportDeclaration>>()

const getImportDeclarations = (sourceFile: SourceFile) => {
  if (!importDeclarationsMap.has(sourceFile)) {
    importDeclarationsMap.set(sourceFile, new Map())
  }

  return importDeclarationsMap.get(sourceFile) as Map<string, ImportDeclaration>
}

function findImportDeclaration(sourceFile: SourceFile, moduleSpecifier: string) {
  const importDeclarations = getImportDeclarations(sourceFile)

  if (importDeclarations.has(moduleSpecifier)) {
    const declaration = importDeclarations.get(moduleSpecifier) as ImportDeclaration

    if ((declaration as any)._compilerNode) {
      return declaration
    }
  }

  return sourceFile.getImportDeclaration((x) => x.getModuleSpecifierValue() === moduleSpecifier)
}

export function appendText(sourceFile: SourceFile, text: string) {
  return sourceFile.insertText(sourceFile.getFullWidth(), EOL + text)
}

export function addNamedImport(
  sourceFile: SourceFile,
  names: readonly string[],
  moduleSpecifier: string,
) {
  const importDeclaration = findImportDeclaration(sourceFile, moduleSpecifier)
  const importDeclarations = getImportDeclarations(sourceFile)

  if (importDeclaration) {
    const currentNames = new Set(importDeclaration.getNamedImports().map((x) => x.getName()))

    importDeclaration.addNamedImports(names.filter((x) => !currentNames.has(x)))
    importDeclarations.set(moduleSpecifier, importDeclaration)

    return
  }

  const delcaration = sourceFile.addImportDeclaration({
    namedImports: [...names],
    moduleSpecifier,
  })

  importDeclarations.set(moduleSpecifier, delcaration)
}

export function addNamespaceImport(sourceFile: SourceFile, name: string, moduleSpecifier: string) {
  const importDeclarations = getImportDeclarations(sourceFile)

  if (importDeclarations.has(moduleSpecifier)) {
    return
  }

  const declaration = sourceFile.addImportDeclaration({
    namespaceImport: name,
    moduleSpecifier,
  })

  importDeclarations.set(moduleSpecifier, declaration)
}
