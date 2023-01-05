import { relative } from 'path'

import {
  SourceFileModule,
  LayoutSourceFileModule,
  FallbackSourceFileModule,
  RedirectSourceFileModule,
} from './SourceFileModule.js'

export function buildImportsAndModules(sourceFileModules: SourceFileModule[], relativeTo: string) {
  let _id = 0
  const imports: string[] = []
  const modules: string[] = []

  let layout: [LayoutSourceFileModule, string] | undefined
  let fallback: [FallbackSourceFileModule | RedirectSourceFileModule, string, string?] | undefined

  for (const mod of sourceFileModules) {
    const id = _id++
    const filePath = mod.sourceFile.getFilePath()
    const moduleName = `typedModule${id}`

    imports.push(
      `import * as ${moduleName} from './${relative(relativeTo, filePath).replace(
        /.ts(x)?/,
        '.js$1',
      )}'`,
    )

    switch (mod._tag) {
      case 'Redirect/Basic':
      case 'Redirect/Environment':
      case 'Fallback/Basic':
      case 'Fallback/Environment': {
        if (!fallback) {
          fallback = [mod, moduleName, layout?.[1]]
        } else {
          throw new Error('Only one root-level fallback module is allowed')
        }

        continue
      }
      case 'Layout/Basic':
      case 'Layout/Environment': {
        layout = [mod, moduleName]

        continue
      }
      case 'Render/Basic': {
        modules.push(
          `Module.make(${moduleName}.route, ${
            mod.isFx ? `() => ${moduleName}.main,` : `${moduleName}.main,`
          }${
            mod.hasLayout
              ? `{ layout: ${moduleName}.layout }`
              : layout
              ? ` { layout: ${layout[1]}.layout }`
              : ''
          })`,
        )
        continue
      }
      case 'Render/Environment': {
        modules.push(
          `Module.make(F.pipe(${moduleName}.route, Route.provideLayer(${moduleName}.environment)), F.flow(${
            mod.isFx ? `() => ${moduleName}.main` : `${moduleName}.main`
          }, Fx.provideSomeLayer(${moduleName}.environment)), ${
            mod.hasLayout
              ? `{ layout: ${moduleName}.layout }`
              : layout
              ? ` { layout: ${layout[1]}.layout }`
              : ''
          })`,
        )
        continue
      }
    }
  }

  return [imports, modules, fallback] as const
}

export function runMatcherWithFallback([fallback, fallbackModuleName, layoutModule]: [
  FallbackSourceFileModule | RedirectSourceFileModule,
  string,
  string?,
]) {
  switch (fallback._tag) {
    case 'Redirect/Basic':
      return `matcher.redirectTo(${fallbackModuleName}.route, ${fallbackModuleName}?.params ?? {})`

    case 'Redirect/Environment':
      return `matcher.redirectTo(F.pipe(${fallbackModuleName}.route, Route.provideLayer(${fallbackModuleName}.environment)), ${fallbackModuleName}?.params ?? {})`

    case 'Fallback/Basic':
      return `matcher.notFound(${
        fallback.isFx ? `() => ${fallbackModuleName}.fallback` : `${fallbackModuleName}.fallback`
      }${layoutModule ? `, {layout:${layoutModule}.layout}` : ``})`

    case 'Fallback/Environment':
      return `matcher.notFound(${
        fallback.isFx
          ? `() => F.pipe(${fallbackModuleName}.fallback, Fx.provideSomeLayer(${fallbackModuleName}.environment))`
          : `F.flow(${fallbackModuleName}.fallback, Fx.provideSomeLayer(${fallbackModuleName}.environment))`
      }${layoutModule ? `, {layout:${layoutModule}.layout}` : ``})`
  }
}
