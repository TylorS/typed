import type { Project } from 'ts-morph'

import { SourceFileModule } from './SourceFileModule.js'
import { buildRenderableModule } from './buildRenderableModule.js'

export function buildClientSideEntrypoint(
  sourceFileModules: SourceFileModule[],
  project: Project,
  outFile: string,
) {
  const entrypoint = buildRenderableModule(sourceFileModules, project, outFile)

  // Add renderInto import
  entrypoint.addImportDeclaration({ moduleSpecifier: '@typed/html', namedImports: ['renderInto'] })

  // Add provideBrowserIntrinsics import
  entrypoint
    .getImportDeclarationOrThrow((i) =>
      i.getModuleSpecifier().getText().includes('@typed/framework'),
    )
    .addNamedImport('provideBrowserIntrinsics')

  // Append render function
  entrypoint.insertText(
    entrypoint.getFullWidth(),
    `
export const render = <T extends HTMLElement>(parentElement: T) => F.pipe(main, renderInto(parentElement), provideBrowserIntrinsics(window, { parentElement }))
`,
  )

  const diagnostics = entrypoint.getPreEmitDiagnostics()

  if (diagnostics.length > 0) {
    console.error(entrypoint.getFullText())

    throw new Error(project.formatDiagnosticsWithColorAndContext(diagnostics))
  }

  return entrypoint
}
