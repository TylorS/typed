import { EOL } from 'os'
import { dirname, relative } from 'path'

import type { Project, SourceFile } from 'ts-morph'

import type {
  EnvironmentSourceFileModule,
  FallbackSourceFileModule,
  LayoutSourceFileModule,
  RedirectSourceFileModule,
  RenderSourceFileModule,
} from './SourceFileModule.js'
import type { ModuleTree, ModuleTreeWithFallback } from './readModules.js'
import { addNamedImport, addNamespaceImport, appendText } from './ts-morph-helpers.js'

/**
 * Construct a typescript module that can be used to access all modules in a
 * ModuleTree,
 */
export function makeRuntimeModule(
  project: Project,
  moduleTree: ModuleTreeWithFallback,
  importer: string,
  fileName: string,
  isBrowser: boolean,
) {
  const importNames = new Map<string, string>()
  const sourceFile = project.createSourceFile(
    fileName,
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
          moduleTree.environment,
        ) +
        ' as const',
    )
  } else {
    appendText(sourceFile, EOL + `export const fallback = null`)
  }

  if (isBrowser) {
    addNamedImport(sourceFile, ['pipe'], '@fp-ts/data/Function')
    addNamedImport(
      sourceFile,
      ['runMatcherWithFallback', 'provideBrowserIntrinsics'],
      '@typed/framework',
    )
    addNamedImport(sourceFile, ['renderInto'], '@typed/html')
    addNamespaceImport(sourceFile, 'Fx', '@typed/fx', true)

    const renderEnvText = moduleTree.environment
      ? `, Fx.provideSomeLayer(${getImportName(moduleTree.environment.sourceFile)}.environment)`
      : ''

    appendText(
      sourceFile,
      EOL +
        `export const render = <T extends HTMLElement>(parentElement: T): Fx.Fx<never, never, T> => pipe(runMatcherWithFallback(matcher, fallback), renderInto(parentElement)${renderEnvText}, provideBrowserIntrinsics(window, { parentElement }))`,
    )

    return sourceFile
  }

  return sourceFile

  function addModuleTreeImports(moduleTree: ModuleTreeWithFallback) {
    if (moduleTree.layout) {
      addNamespace(moduleTree.layout.sourceFile)
    }

    if (moduleTree.environment) {
      addNamespace(moduleTree.environment.sourceFile)
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

    while (toProcess.length > 0) {
      const current = toProcess.shift() as ModuleTree

      if (current.modules.length > 0) {
        modules.push(
          ...current.modules.map((mod) =>
            makeRenderModule(mod, current.layout, current.environment),
          ),
        )
      }

      toProcess.push(...current.children)
    }

    return modules.join(`,${EOL}  `)
  }

  function makeRenderModule(
    render: RenderSourceFileModule,
    layout?: LayoutSourceFileModule,
    environment?: EnvironmentSourceFileModule,
  ): string {
    const name = getImportName(render.sourceFile)
    const layoutOptions = makeLayoutModuleOptions(render.hasLayout ? render : layout, environment)

    addNamedImport(sourceFile, ['Module'], '@typed/framework')

    addNamedImport(
      sourceFile,
      [
        ...(render.isFx ? ['constant'] : []),
        ...(environment ? [render.isFx ? 'pipe' : 'flow'] : []),
        ...(layout && environment ? ['pipe'] : []),
      ],
      '@fp-ts/data/Function',
    )

    if (environment) {
      addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
    }

    if (render.hasEnvironment) {
      addNamespaceImport(sourceFile, 'Route', '@typed/route')
      addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
      addNamedImport(
        sourceFile,
        render.isFx ? ['constant', 'pipe'] : ['pipe', 'flow'],
        '@fp-ts/data/Function',
      )

      const routeEnvText = environment
        ? `, Route.provideSomeLayer(${getImportName(environment.sourceFile)}.environment)`
        : ''

      const mainEnvText = environment
        ? `, Fx.provideSomeLayer(${getImportName(environment.sourceFile)}.environment)`
        : ''

      return `Module.make(pipe(${name}.route${routeEnvText}, Route.provideSomeLayer(${name}.environment)), ${
        render.isFx
          ? `constant(pipe(${name}.main${mainEnvText}, Fx.provideSomeLayer(${name}.environment)))`
          : `flow(${name}.main${mainEnvText}, Fx.provideSomeLayer(${name}.environment))`
      } ${layoutOptions ? `, { ${layoutOptions} }` : ''})`
    }

    if (environment) {
      const mainText = render.isFx
        ? `constant(pipe(${name}.main, Fx.provideSomeLayer(${getImportName(
            environment.sourceFile,
          )}.environment)))`
        : `flow(${name}.main, Fx.provideSomeLayer(${getImportName(
            environment.sourceFile,
          )}.environment))`

      return `Module.make(${name}.route, ${mainText}${
        layoutOptions ? `, { ${layoutOptions} }` : ''
      })`
    }

    const mainText = render.isFx ? `constant(${name}.main)` : `${name}.main`

    return `Module.make(${name}.route, ${mainText}${layoutOptions ? `, { ${layoutOptions} }` : ''})`
  }

  function makeLayoutModuleOptions(
    mod?: FallbackSourceFileModule | RenderSourceFileModule | LayoutSourceFileModule,
    environment?: EnvironmentSourceFileModule,
  ): string {
    if (!mod) {
      return ''
    }

    const name = getImportName(mod.sourceFile)

    if (mod.hasEnvironment) {
      addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
      addNamedImport(sourceFile, ['pipe'], '@fp-ts/data/Function')

      const layoutEnvText = environment
        ? `, Fx.provideSomeLayer(${getImportName(environment.sourceFile)}.environment)`
        : ''

      return `layout: pipe(${name}.layout${layoutEnvText}, Fx.provideSomeLayer(${name}.environment))`
    }

    return environment
      ? `layout: pipe(${name}.layout, Fx.provideSomeLayer(${getImportName(
          environment.sourceFile,
        )}.environment))`
      : `layout: ${name}.layout`
  }

  function getImportName(sourceFile: SourceFile) {
    return importNames.get(sourceFile.getFilePath()) as string
  }

  function constructFallback(
    sourceFile: SourceFile,
    fallback: FallbackSourceFileModule | RedirectSourceFileModule,
    name: string,
    layout: LayoutSourceFileModule | undefined,
    environment: EnvironmentSourceFileModule | undefined,
  ) {
    switch (fallback._tag) {
      case 'Fallback': {
        if (fallback.hasEnvironment) {
          addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
          addNamedImport(
            sourceFile,
            fallback.isFx ? ['pipe', 'constant'] : ['pipe'],
            '@fp-ts/data/Function',
          )
          const layoutOptions = makeLayoutModuleOptions(fallback.hasLayout ? fallback : layout)

          const mainEnvText = environment
            ? `, Fx.provideSomeLayer(${getImportName(environment.sourceFile)}.environment)`
            : ''

          return `export const fallback = { type: 'Renderable', fallback: ${
            fallback.isFx
              ? `constant(pipe(${name}.fallback${mainEnvText}, Fx.provideSomeLayer(${name}.environment)))`
              : `flow(${name}.fallback${mainEnvText}, Fx.provideSomeLayer(${name}.environment))`
          }${layoutOptions ? `, ${layoutOptions}` : ''} }`
        }

        const layoutOptions = makeLayoutModuleOptions(fallback.hasLayout ? fallback : layout)
        return `export const fallback = { type: 'Renderable', fallback: ${
          fallback.isFx
            ? environment
              ? `() => pipe(${name}.fallback, Fx.provideSomeLayer(${getImportName(
                  environment.sourceFile,
                )}.environment))`
              : `() => ${name}.fallback`
            : environment
            ? `flow(${name}.fallback, Fx.provideSomeLayer(${getImportName(
                environment.sourceFile,
              )}.environment))`
            : `${name}.fallback`
        }${layoutOptions ? `, ${layoutOptions}` : ''} }`
      }
      case 'Redirect': {
        if (fallback.hasEnvironment) {
          addNamespaceImport(sourceFile, 'Fx', '@typed/fx')
          addNamespaceImport(sourceFile, 'Route', '@typed/route')
          addNamedImport(sourceFile, ['pipe'], '@fp-ts/data/Function')

          const routeEnvText = environment
            ? `, Route.provideSomeLayer(${getImportName(environment.sourceFile)}.environment)`
            : ''

          return `export const redirect = { type: 'Redirect', route: pipe(${name}.route${routeEnvText}, Route.provideSomeLayer(${name}.environment))${
            fallback.hasParams ? `, params: ${name}.params` : ``
          } }`
        }

        const routeText = environment
          ? `pipe(${name}.route, Route.provideSomeLayer(${name}.environment))`
          : `${name}.route`

        return `export const redirect = { type: 'Redirect', route: ${routeText}${
          fallback.hasParams ? `, params: ${name}.params` : ``
        } }`
      }
    }
  }
}
