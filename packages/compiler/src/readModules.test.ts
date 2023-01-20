import { deepStrictEqual } from 'assert'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

import { Project } from 'ts-morph'
import { describe, it } from 'vitest'

import type {
  EnvironmentSourceFileModule,
  FallbackSourceFileModule,
  LayoutSourceFileModule,
  RedirectSourceFileModule,
  RenderSourceFileModule,
} from './SourceFileModule.js'
import { readDirectory } from './readDirectory.js'
import { type ModuleTree, type ModuleTreeWithFallback, readModules } from './readModules.js'

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
          _tag: 'Layout/Basic',
          filePath: 'pages/layout.ts',
        }
        const expected = {
          directory: 'pages',
          layout: mainLayout,
          fallback: {
            _tag: 'Fallback/Basic',
            filePath: 'pages/fallback.ts',
            isFx: false,
            hasLayout: false,
          },
          environment: null,
          modules: [
            {
              _tag: 'Render/Basic',
              filePath: 'pages/home.ts',
              isFx: true,
              hasLayout: false,
            },
          ],
          children: [
            {
              directory: 'pages/bar',
              layout: mainLayout,
              fallback: null,
              environment: { _tag: 'Environment', filePath: 'pages/bar/environment.ts' },
              modules: [
                {
                  _tag: 'Render/Basic',
                  filePath: 'pages/bar/bar.ts',
                  isFx: false,
                  hasLayout: true,
                },
              ],
              children: [],
            },
            {
              directory: 'pages/baz',
              layout: mainLayout,
              fallback: null,
              environment: null,
              modules: [
                {
                  _tag: 'Render/Basic',
                  filePath: 'pages/baz/baz.ts',
                  isFx: true,
                  hasLayout: false,
                },
              ],
              children: [],
            },
            {
              directory: 'pages/foo',
              layout: mainLayout,
              fallback: null,
              environment: null,
              modules: [
                {
                  _tag: 'Render/Basic',
                  filePath: 'pages/foo/foo.ts',
                  isFx: false,
                  hasLayout: false,
                },
              ],
              children: [],
            },
          ],
        }

        deepStrictEqual(stripModules(moduleTree), expected)
      },
      30 * 1000,
    )
  })
})

function stripModules(tree: ModuleTreeWithFallback | ModuleTree): any {
  return {
    directory: relative(exampleDirectory, tree.directory),
    layout: tree.layout ? stripLayoutModule(tree.layout) : null,
    fallback: (tree as ModuleTreeWithFallback).fallback
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        stripFallbackModule((tree as ModuleTreeWithFallback).fallback!)
      : null,
    environment: tree.environment ? stripEnvironmentModule(tree.environment) : null,
    modules: tree.modules?.map(stripRenderModule) ?? [],
    children: tree.children.map(stripModules),
  }
}

function stripLayoutModule(m: LayoutSourceFileModule) {
  return {
    _tag: m._tag,
    filePath: relative(exampleDirectory, m.sourceFile.getFilePath()),
  }
}

function stripRenderModule(m: RenderSourceFileModule) {
  return {
    _tag: m._tag,
    filePath: relative(exampleDirectory, m.sourceFile.getFilePath()),
    isFx: m.isFx,
    hasLayout: m.hasLayout,
  }
}

function stripFallbackModule(m: FallbackSourceFileModule | RedirectSourceFileModule) {
  switch (m._tag) {
    case 'Fallback/Basic':
    case 'Fallback/Environment': {
      return {
        _tag: m._tag,
        filePath: relative(exampleDirectory, m.sourceFile.getFilePath()),
        isFx: m.isFx,
        hasLayout: m.hasLayout,
      }
    }
    case 'Redirect/Basic':
    case 'Redirect/Environment': {
      return {
        _tag: m._tag,
        filePath: relative(exampleDirectory, m.sourceFile.getFilePath()),
      }
    }
  }
}

function stripEnvironmentModule(m: EnvironmentSourceFileModule) {
  return {
    _tag: m._tag,
    filePath: relative(exampleDirectory, m.sourceFile.getFilePath()),
  }
}
