import { deepStrictEqual } from 'assert'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { Project } from 'ts-morph'
import { describe, it } from 'vitest'

import { moduleTreeToJson } from './json.js'
import { readDirectory } from './readDirectory.js'
import { readModules } from './readModules.js'

const filePath = fileURLToPath(import.meta.url)
const directory = dirname(filePath)
const rootDirectory = dirname(dirname(dirname(directory)))
const exampleDirectory = join(rootDirectory, 'example')

describe(import.meta.url, () => {
  const project = new Project({ tsConfigFilePath: join(exampleDirectory, 'tsconfig.json') })

  describe(readModules.name, () => {
    it(
      'should read modules from a directory',
      async () => {
        const directory = await readDirectory(join(exampleDirectory, 'pages'))
        const moduleTree = readModules(project, directory)
        const mainLayout = {
            _tag: 'Layout',
            sourceFile: 'pages/layout.ts',
            hasEnvironment: false,
          }
        const expected = {
          directory: 'pages',
          modules: [
            {
              _tag: 'Render',
              sourceFile: 'pages/home.ts',
              route: '/',
              isFx: true,
              hasLayout: false,
              hasEnvironment: false,
              hasStaticPaths: false,
            },
          ],
          children: [
            {
              directory: 'pages/bar',
              modules: [
                {
                  _tag: 'Render',
                  sourceFile: 'pages/bar/bar.ts',
                  route: '/bar/:bar',
                  isFx: false,
                  hasLayout: true,
                  hasEnvironment: false,
                  hasStaticPaths: true,
                },
              ],
              children: [],
              layout: mainLayout,
              environment: {
                _tag: 'Environment',
                sourceFile: 'pages/bar/environment.ts',
              },
            },
            {
              directory: 'pages/baz',
              modules: [
                {
                  _tag: 'Render',
                  sourceFile: 'pages/baz/baz.ts',
                  route: '/baz/:baz',
                  isFx: true,
                  hasLayout: false,
                  hasEnvironment: false,
                  hasStaticPaths: true,
                },
              ],
              children: [],
              layout: mainLayout,
            },
            {
              directory: 'pages/foo',
              modules: [
                {
                  _tag: 'Render',
                  sourceFile: 'pages/foo/foo.ts',
                  route: '/foo/:foo',
                  isFx: false,
                  hasLayout: false,
                  hasEnvironment: false,
                  hasStaticPaths: true,
                },
              ],
              children: [],
              layout: mainLayout,
            },
          ],
          layout: mainLayout,
          fallback: {
            _tag: 'Fallback',
            sourceFile: 'pages/fallback.ts',
            isFx: false,
            hasLayout: false,
            hasEnvironment: false,
          },
        }

        deepStrictEqual(moduleTreeToJson(exampleDirectory, moduleTree), expected)
      },
      30 * 1000,
    )
  })
})
