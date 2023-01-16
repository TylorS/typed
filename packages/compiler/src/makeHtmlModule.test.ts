import { readFileSync } from 'fs'
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
        const filePath = join(exampleDirectory, 'index.html')
        const sourceFile = await makeHtmlModule({
          project,
          filePath,
          html: readFileSync(filePath).toString(),
          importer: join(exampleDirectory, 'browser.ts'),
          serverOutputDirectory: join(exampleDirectory, 'dist/server'),
          clientOutputDirectory: join(exampleDirectory, 'dist/client'),
        })

        console.log(sourceFile.getFullText())
      },
      30 * 1000,
    )
  })
})
