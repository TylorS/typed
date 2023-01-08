import { deepStrictEqual } from 'assert'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

import { Project } from 'ts-morph'
import { describe, it } from 'vitest'

import {
  FallbackSourceFileModule,
  LayoutSourceFileModule,
  RedirectSourceFileModule,
  RenderSourceFileModule,
} from './SourceFileModule.js'
import { readDirectory } from './readDirectory.js'
import { ModuleTree, ModuleTreeWithFallback, readModules } from './readModules.js'

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
        const expected = {
          directory: 'pages',
          layout: {
            _tag: 'Layout/Basic',
            filePath: 'pages/layout.ts',
            isNested: false,
          },
          fallback: {
            _tag: 'Fallback/Basic',
            filePath: 'pages/fallback.ts',
            isFx: false,
            hasLayout: false,
            isNested: false,
          },
          modules: [
            {
              _tag: 'Render/Basic',
              filePath: 'pages/home.ts',
              isFx: true,
              hasLayout: false,
              isNested: false,
            },
          ],
          children: [
            {
              directory: 'pages/bar',
              fallback: null,
              layout: null,
              modules: [
                {
                  _tag: 'Render/Environment',
                  filePath: 'pages/bar/bar.ts',
                  isFx: false,
                  hasLayout: true,
                  isNested: false,
                },
              ],
              children: [],
            },
            {
              directory: 'pages/foo',
              fallback: null,
              layout: null,
              modules: [
                {
                  _tag: 'Render/Basic',
                  filePath: 'pages/foo/foo.ts',
                  isFx: false,
                  hasLayout: false,
                  isNested: false,
                },
              ],
              children: [],
            },
            {
              directory: 'pages/react',
              fallback: null,
              layout: null,
              modules: [
                {
                  _tag: 'Render/Basic',
                  filePath: 'pages/react/counter.tsx',
                  isFx: false,
                  hasLayout: false,
                  isNested: false,
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
    modules: tree.modules?.map(stripRenderModule) ?? [],
    children: tree.children.map(stripModules),
  }
}

function stripLayoutModule(m: LayoutSourceFileModule) {
  return {
    _tag: m._tag,
    filePath: relative(exampleDirectory, m.sourceFile.getFilePath()),
    isNested: m.isNested,
  }
}

function stripRenderModule(m: RenderSourceFileModule) {
  return {
    _tag: m._tag,
    filePath: relative(exampleDirectory, m.sourceFile.getFilePath()),
    isFx: m.isFx,
    hasLayout: m.hasLayout,
    isNested: m.isNested,
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
        isNested: m.isNested,
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
