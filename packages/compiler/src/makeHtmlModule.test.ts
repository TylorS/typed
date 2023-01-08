import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { Project } from 'ts-morph'
import { describe, it } from 'vitest'

import { makeHtmlModule } from './makeHtmlModule.js'

const filePath = fileURLToPath(import.meta.url)
const directory = dirname(filePath)
const rootDirectory = dirname(dirname(dirname(directory)))
const exampleDirectory = join(rootDirectory, 'example')

describe(import.meta.url, () => {
  const project = new Project({ tsConfigFilePath: join(exampleDirectory, 'tsconfig.json') })

  describe(makeHtmlModule.name, () => {
    it(
      'should construct a typescript module',
      async () => {
        const sourceFile = makeHtmlModule(
          project,
          join(exampleDirectory, 'index.html'),
          join(exampleDirectory, 'server.ts'),
          join(exampleDirectory, 'dist/server'),
          join(exampleDirectory, 'dist/client'),
        )

        // TODO: add some assertions

        console.log(sourceFile.getFullText())
      },
      30 * 1000,
    )
  })
})
