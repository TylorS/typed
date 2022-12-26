import { deepStrictEqual } from 'node:assert'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Project } from 'ts-morph'
import { describe, it } from 'vitest'

import { scanSourceFiles } from './scanSourceFiles.js'

const srcDirectory = fileURLToPath(dirname(import.meta.url))
const rootDirectory = dirname(dirname(dirname(srcDirectory)))
const examplesDirectory = join(rootDirectory, 'examples')
const tsConfigFilePath = join(examplesDirectory, 'tsconfig.json')

describe(import.meta.url, () => {
  describe('scanPages', () => {
    it('allows extracting information from source files', async () => {
      const project = new Project({ tsConfigFilePath })
      const sourceFileModules = scanSourceFiles([examplesDirectory + '/pages/**/*'], project)
      const expected = [
        ['Layout/Basic', join(examplesDirectory, 'pages/layout.ts')],
        ['Fallback/Basic', join(examplesDirectory, 'pages/fallback.ts')],
        ['Render/Basic', join(examplesDirectory, 'pages/home.ts')],
        ['Render/Basic', join(examplesDirectory, 'pages/bar/bar.ts')],
        ['Render/Basic', join(examplesDirectory, 'pages/foo/foo.ts')],
      ]

      deepStrictEqual(
        sourceFileModules.map(({ _tag, sourceFile }) => [_tag, sourceFile.getFilePath()]),
        expected,
      )
    })
  })
})
