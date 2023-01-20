import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { Project } from 'ts-morph'
import { describe, it } from 'vitest'

import { makeRuntimeModule } from './makeRuntimeModule.js'
import { readDirectory } from './readDirectory.js'
import { readModules } from './readModules.js'

const filePath = fileURLToPath(import.meta.url)
const directory = dirname(filePath)
const rootDirectory = dirname(dirname(dirname(directory)))
const exampleDirectory = join(rootDirectory, 'example')

describe(import.meta.url, () => {
  const project = new Project({ tsConfigFilePath: join(exampleDirectory, 'tsconfig.json') })

  describe(makeRuntimeModule.name, () => {
    it(
      'should construct a typescript module',
      async () => {
        const directory = await readDirectory(join(exampleDirectory, 'pages'))
        const moduleTree = readModules(project, directory)
        const sourceFile = makeRuntimeModule(
          project,
          moduleTree,
          join(exampleDirectory, 'browser.ts'),
          join(exampleDirectory, 'example.ts'),
          false,
        )

        const diagnostics = sourceFile.getPreEmitDiagnostics()

        if (diagnostics.length > 0) {
          throw new Error(project.formatDiagnosticsWithColorAndContext(diagnostics))
        }
      },
      30 * 1000,
    )
  })
})
