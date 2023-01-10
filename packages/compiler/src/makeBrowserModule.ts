import { Project, SourceFile } from 'ts-morph'

import { makeRuntimeModule } from './makeRuntimeModule.js'
import { ModuleTreeWithFallback } from './readModules.js'
import { addNamedImport, appendText } from './ts-morph-helpers.js'

export function makeBrowserModule(
  project: Project,
  moduleTree: ModuleTreeWithFallback,
  importer: string,
): SourceFile {
  const sourceFile = makeRuntimeModule(project, moduleTree, importer)

  addNamedImport(sourceFile, ['pipe'], '@fp-ts/data/Function')
  addNamedImport(
    sourceFile,
    ['runMatcherWithFallback', 'provideBrowserIntrinsics'],
    '@typed/framework',
  )
  addNamedImport(sourceFile, ['renderInto'], '@typed/html')

  appendText(
    sourceFile,
    `export const render = <T extends HTMLElement>(parentElement: T) => pipe(runMatcherWithFallback(matcher, fallback), renderInto(parentElement), provideBrowserIntrinsics(window, { parentElement }))`,
  )

  return sourceFile
}
