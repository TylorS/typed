import { Project } from 'ts-morph'

const project = new Project()
const sourceFile = project.createSourceFile('example.ts', ``)

sourceFile.addImportDeclaration({
  namespaceImport: 'data',
  moduleSpecifier: '@fp-ts/data',
})

try {
  const diagnostics = project.getPreEmitDiagnostics()

  if (diagnostics.length > 0) {
    console.error(project.formatDiagnosticsWithColorAndContext(diagnostics))
  }
} catch (e) {
  console.error((e as Error).message)
}
