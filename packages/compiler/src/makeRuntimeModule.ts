import { EOL } from 'os'
import { dirname, relative } from 'path'

import { Project, SourceFile } from 'ts-morph'

import {
  FallbackSourceFileModule,
  LayoutSourceFileModule,
  RedirectSourceFileModule,
  RenderSourceFileModule,
} from './SourceFileModule.js'
import { ModuleTree, ModuleTreeWithFallback } from './readModules.js'
import { addNamedImport, addNamespaceImport, appendText } from './ts-morph-helpers.js'

/**
 * Construct a typescript module that can be used to access all modules in a
 * ModuleTree,
 */
export function makeRuntimeModule(
  project: Project,
  moduleTree: ModuleTreeWithFallback,
  importer: string,
) {
  const importNames = new Map<string, string>()
  const tsPath = `${moduleTree.directory}.__generated__.ts`
  const sourceFile = project.createSourceFile(
    tsPath,
    '/* File auto-generated by @typed/compiler */',
    { overwrite: true },
  )
  let i = 0

  addNamedImport(sourceFile, ['buildModules'], '@typed/framework')
  addModuleTreeImports(moduleTree)

  appendText(
    sourceFile,
    `export const modules = [${EOL}  ${constructModules(moduleTree)}${EOL}] as const`,
  )
  appendText(sourceFile, EOL + `export const matcher = buildModules(modules)`)

  if (moduleTree.fallback) {
    appendText(
      sourceFile,
      EOL +
        constructFallback(
          sourceFile,
          moduleTree.fallback,
          getImportName(moduleTree.fallback.sourceFile),
          moduleTree.layout,
        ) +
        ' as const',
    )
  } else {
    appendText(sourceFile, EOL + `export const fallback = null`)
  }

  return sourceFile

  function addModuleTreeImports(moduleTree: ModuleTreeWithFallback) {
    if (moduleTree.layout) {
      addNamespace(moduleTree.layout.sourceFile)
    }

    if (moduleTree.fallback) {
      addNamespace(moduleTree.fallback.sourceFile)
    }

    if (moduleTree.modules) {
      for (const mod of moduleTree.modules) {
        addNamespace(mod.sourceFile)
      }
    }

    for (const child of moduleTree.children) {
      addModuleTreeImports(child)
    }
  }

  function addNamespace(toImport: SourceFile) {
    const filePath = toImport.getFilePath()

    if (importNames.has(filePath)) {
      return importNames.get(filePath) as string
    }

    const name = `typedModule${i++}`

    importNames.set(filePath, name)

    addNamespaceImport(
      sourceFile,
      name,
      './' + relative(dirname(importer), filePath.replace(/.ts(x)?/, '.js$1')),
    )
  }

  function constructModules(moduleTree: ModuleTree) {
    const toProcess: ModuleTree[] = [moduleTree]
    const modules: string[] = []
    let layout: LayoutSourceFileModule | undefined

    while (toProcess.length > 0) {
      const current = toProcess.shift() as ModuleTree

      if (current.layout) {
        layout = current.layout
      }

      if (current.modules.length > 0) {
        modules.push(...current.modules.map((mod) => makeRenderModule(mod, layout)))
      }

      toProcess.push(...current.children)
    }

    return modules.join(`,${EOL}  `)
  }

  function makeRenderModule(
    render: RenderSourceFileModule,
    layout?: LayoutSourceFileModule,
  ): string {
    const name = getImportName(render.sourceFile)
    const layoutOptions = makeLayoutModuleOptions(render.hasLayout ? render : layout)

    addNamedImport(sourceFile, ['Module'], '@typed/framework')

    if (render.isFx) {
      addNamedImport(sourceFile, ['constant'], '@fp-ts/data/Function')
    }

    switch (render._tag) {
      case 'Render/Basic': {
        return `Module.make(${name}.route, ${
          render.isFx ? `constant(${name}.main)` : `${name}.main`
        }${layoutOptions ? `, { ${layoutOptions} }` : ''})`
      }
      case 'Render/Environment': {
        addNamespaceImport(sourceFile, 'Route', '@typed/route')
        addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
        addNamedImport(
          sourceFile,
          render.isFx ? ['constant', 'pipe'] : ['pipe', 'flow'],
          '@fp-ts/data/Function',
        )

        return `Module.make(pipe(${name}.route, Route.provideLayer(${name}.environment)), ${
          render.isFx
            ? `constant(pipe(${name}.main, Fx.provideSomeLayer(${name}.environment)))`
            : `flow(${name}.main, Fx.provideSomeLayer(${name}.environment))`
        } ${layoutOptions ? `, { ${layoutOptions} }` : ''})`
      }
    }
  }

  function makeLayoutModuleOptions(
    mod?: FallbackSourceFileModule | RenderSourceFileModule | LayoutSourceFileModule,
  ): string {
    if (!mod) {
      return ''
    }

    const name = getImportName(mod.sourceFile)

    switch (mod._tag) {
      case 'Fallback/Basic':
      case 'Render/Basic':
      case 'Layout/Basic':
        return `layout: ${name}.layout`
      case 'Fallback/Environment':
      case 'Render/Environment':
      case 'Layout/Environment': {
        addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
        addNamedImport(sourceFile, ['pipe'], '@fp-ts/data/Function')

        return `layout: pipe(${name}.layout, Fx.provideSomeLayer(${name}.environment))`
      }
    }

    return ``
  }

  function getImportName(sourceFile: SourceFile) {
    return importNames.get(sourceFile.getFilePath()) as string
  }

  function constructFallback(
    sourceFile: SourceFile,
    fallback: FallbackSourceFileModule | RedirectSourceFileModule,
    name: string,
    layout: LayoutSourceFileModule | undefined,
  ) {
    switch (fallback._tag) {
      case 'Fallback/Basic': {
        const layoutOptions = makeLayoutModuleOptions(fallback.hasLayout ? fallback : layout)
        return `export const fallback = { type: 'Renderable', fallback: ${
          fallback.isFx ? `() => ${name}.fallback` : `${name}.fallback`
        }${layoutOptions ? `, ${layoutOptions}` : ''} }`
      }
      case 'Fallback/Environment': {
        addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
        addNamedImport(
          sourceFile,
          fallback.isFx ? ['pipe', 'constant'] : ['pipe'],
          '@fp-ts/data/Function',
        )
        const layoutOptions = makeLayoutModuleOptions(fallback.hasLayout ? fallback : layout)

        return `export const fallback = { type: 'Renderable', fallback: ${
          fallback.isFx
            ? `constant(pipe(${name}.fallback, Fx.provideSomeLayer(${name}.environment)))`
            : `flow(${name}.fallback, Fx.provideSomeLayer(${name}.environment))`
        }${layoutOptions ? `, ${layoutOptions}` : ''} }`
      }
      case 'Redirect/Basic':
        return `export const redirect = { type: 'Redirect', route: ${name}.route${
          fallback.hasParams ? `, params: ${name}.params` : ``
        } }`
      case 'Redirect/Environment': {
        addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
        addNamespaceImport(sourceFile, 'Route', '@typed/route')
        addNamedImport(sourceFile, ['pipe'], '@fp-ts/data/Function')

        return `export const redirect = { type: 'Redirect', route: pipe(${name}.route, Route.provideLayer(${name}.environment))${
          fallback.hasParams ? `, params: ${name}.params` : ``
        } }`
      }
    }
  }
}