import { EOL } from 'os'

import { ImportDeclaration, SourceFile } from 'ts-morph'

const importDeclarations = new Map<string, ImportDeclaration>()

function findImportDeclaration(sourceFile: SourceFile, moduleSpecifier: string) {
  const key = sourceFile.getFilePath() + moduleSpecifier

  if (importDeclarations.has(key)) {
    const declaration = importDeclarations.get(key) as ImportDeclaration

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
  const key = sourceFile.getFilePath() + moduleSpecifier
  const importDeclaration = findImportDeclaration(sourceFile, moduleSpecifier)

  if (importDeclaration) {
    const currentNames = new Set(importDeclaration.getNamedImports().map((x) => x.getName()))

    importDeclaration.addNamedImports(names.filter((x) => !currentNames.has(x)))
    importDeclarations.set(key, importDeclaration)

    return
  }

  const delcaration = sourceFile.addImportDeclaration({
    namedImports: [...names],
    moduleSpecifier,
  })

  importDeclarations.set(key, delcaration)
}

export function addNamespaceImport(sourceFile: SourceFile, name: string, moduleSpecifier: string) {
  const key = sourceFile.getFilePath() + moduleSpecifier

  if (importDeclarations.has(key)) {
    return
  }

  const declaration = sourceFile.addImportDeclaration({
    namespaceImport: name,
    moduleSpecifier,
  })

  importDeclarations.set(key, declaration)
}
