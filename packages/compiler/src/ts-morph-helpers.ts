import { EOL } from 'os'

import { SourceFile } from 'ts-morph'

function findImportDeclaration(sourceFile: SourceFile, moduleSpecifier: string) {
  return sourceFile.getImportDeclaration((x) => x.getModuleSpecifierValue() === moduleSpecifier)
}

export function appendText(sourceFile: SourceFile, text: string) {
  return sourceFile.insertText(sourceFile.getFullWidth(), EOL + text)
}

export function addNamedImport(
  sourceFile: SourceFile,
  names: readonly string[],
  moduleSpecifier: string,
  typeOnly = false,
) {
  const importDeclaration = findImportDeclaration(sourceFile, moduleSpecifier)

  if (importDeclaration) {
    const currentNames = new Set(importDeclaration.getNamedImports().map((x) => x.getName()))

    importDeclaration.addNamedImports(names.filter((x) => !currentNames.has(x)))

    return
  }

  sourceFile.addImportDeclaration({
    namedImports: [...names],
    moduleSpecifier,
    isTypeOnly: typeOnly,
  })
}

export function addNamespaceImport(sourceFile: SourceFile, name: string, moduleSpecifier: string) {
  const importDeclaration = findImportDeclaration(sourceFile, moduleSpecifier)

  if (importDeclaration) {
    return
  }

  sourceFile.addImportDeclaration({
    namespaceImport: name,
    moduleSpecifier,
  })
}
