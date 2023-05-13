export class FileBuilder {
  protected imports = new Map<string, ImportStatement>()
  protected statements: Statement[] = []

  protected addImport(importStatement: ImportStatement): this {
    const current = this.imports.get(importStatement.moduleSpecifier)

    if (current) {
      if (current._tag !== importStatement._tag) {
        throw new Error(
          `Cannot add import ${importStatement.moduleSpecifier} with different type of import statement. Generated file content will be incorrect.`,
        )
      }

      // Merge named imports
      if (current._tag === 'ImportDeclaration') {
        for (const namedImport of (importStatement as ImportDeclarationStatement).namedImports) {
          const existing = current.namedImports.find((x) => x.name === namedImport.name)

          if (existing && existing.alias !== namedImport.alias) {
            throw new Error(
              `Cannot add import ${importStatement.moduleSpecifier} with different aliases. Generated file content will be incorrect.`,
            )
          }

          if (!existing) {
            current.namedImports.push(namedImport)
          }
        }
      }
    } else {
      this.imports.set(importStatement.moduleSpecifier, importStatement)
    }

    return this
  }

  public addImportDeclaration(namedImports: NamedImport[], moduleSpecifier: string): this {
    return this.addImport(ImportDeclarationStatement(namedImports, moduleSpecifier))
  }

  public addNamespaceImportDeclaration(namespace: string, moduleSpecifier: string): this {
    return this.addImport(NamespaceImportDeclarationStatement(namespace, moduleSpecifier))
  }

  public addStatement(statement: Statement): this {
    this.statements.push(statement)
    return this
  }

  public addText(text: string): this {
    return this.addStatement(TextStatement(text))
  }

  public build(): string {
    let result = ''

    for (const importStatement of this.imports.values()) {
      result += this.printImportStatement(importStatement)
    }

    for (const statement of this.statements) {
      result += this.printStatement(statement)
    }

    return result
  }

  protected printImportStatement(importStatement: ImportStatement): string {
    switch (importStatement._tag) {
      case 'ImportDeclaration':
        return `import { ${this.printNamedImports(importStatement.namedImports)} } from '${
          importStatement.moduleSpecifier
        }'`
      case 'NamespaceImportDeclaration':
        return `import * as ${importStatement.namespace} from '${importStatement.moduleSpecifier}'`
    }
  }

  protected printNamedImports(namedImports: NamedImport[]): string {
    return namedImports
      .map((namedImport) => {
        if (namedImport.alias) {
          return `${namedImport.name} as ${namedImport.alias}`
        }

        return namedImport.name
      })
      .join(', ')
  }

  protected printStatement(statement: Statement): string {
    switch (statement._tag) {
      case 'TextStatement':
        return statement.text
    }
  }
}

// Note: Default exports are not currently supported, they're bad design anyway.
export type ImportStatement = ImportDeclarationStatement | NamespaceImportDeclarationStatement

export interface ImportDeclarationStatement {
  readonly _tag: 'ImportDeclaration'
  readonly namedImports: NamedImport[]
  readonly moduleSpecifier: string
}

export function ImportDeclarationStatement(
  namedImports: NamedImport[],
  moduleSpecifier: string,
): ImportDeclarationStatement {
  return {
    _tag: 'ImportDeclaration',
    namedImports,
    moduleSpecifier,
  }
}

export interface NamedImport {
  readonly name: string
  readonly alias?: string
}

export function NamedImport(name: string, alias?: string): NamedImport {
  return {
    name,
    alias,
  }
}

export interface NamespaceImportDeclarationStatement {
  readonly _tag: 'NamespaceImportDeclaration'
  readonly namespace: string
  readonly moduleSpecifier: string
}

export function NamespaceImportDeclarationStatement(
  namespace: string,
  moduleSpecifier: string,
): NamespaceImportDeclarationStatement {
  return {
    _tag: 'NamespaceImportDeclaration',
    namespace,
    moduleSpecifier,
  }
}

export type Statement = TextStatement

export interface TextStatement {
  readonly _tag: 'TextStatement'
  readonly text: string
}

export function TextStatement(text: string): TextStatement {
  return {
    _tag: 'TextStatement',
    text,
  }
}
