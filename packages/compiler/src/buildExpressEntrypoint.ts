import { EOL } from 'os'
import { dirname, relative } from 'path'

import type { Project } from 'ts-morph'

import {
  FallbackSourceFileModule,
  LayoutSourceFileModule,
  RedirectSourceFileModule,
  SourceFileModule,
} from './SourceFileModule.js'

// TODO: Need to allow adding custom middlewares - should we expose the server via a virtual module?
// TODO: Need to setup a proper fallback URL for the server-side instead of using runPages

export function buildExpressEntrypoint(
  sourceFileModules: SourceFileModule[],
  project: Project,
  outFile: string,
) {
  const [imports, modules, fallback] = buildImportsAndModules(sourceFileModules, dirname(outFile))
  const shouldImportRoute = modules.some((x) => x.includes('provideLayer'))
  const shouldImportModule = modules.length > 0

  const entrypoint = project.createSourceFile(
    outFile,
    `/* This file was auto-generated by @typed/compiler */

import { join } from 'path'

import * as F from '@fp-ts/data/Function'
import { readIndexHtml, getClientDirectory, runExpressApp } from '@typed/compiler'
import { ${shouldImportModule ? 'Module, ': ""}buildModules } from '@typed/framework'
import * as Fx from '@typed/fx' ${
      shouldImportRoute ? EOL + `import * as Route from '@typed/route'` : ''
    }
import express from 'express'
import expressStaticGzip from 'express-static-gzip'
import httpDevServer from 'vavite/http-dev-server'
${imports.join(EOL)}

const MAX_AGE = 31536000000 // 1 year

const app = express()
const clientDirectory = getClientDirectory(import.meta.url)

if (import.meta.env.PROD) {
  // TODO: Handle mapping assets to a CDN in production
  app.use(
    expressStaticGzip(clientDirectory, { serveStatic: { maxAge: MAX_AGE, cacheControl: true } })
  )
}

const matcher = buildModules([
  ${modules.join(',' + EOL + '  ')}
])
const main = ${fallback ? runMatcherWithFallback(fallback) : `matcher.run`}
const indexHtml: string = readIndexHtml(join(clientDirectory, 'index.html'))

app.get('*', runExpressApp(main, indexHtml))

if (httpDevServer) {
  httpDevServer.on('request', app)
} else {
  app.listen(3000, () => {
    console.log('Starting prod server on port 3000')
  })
}
`,
    { overwrite: true },
  )

  const diagnostics = entrypoint.getPreEmitDiagnostics()

  if (diagnostics.length > 0) {
    console.info(entrypoint.getFullText())
    console.warn(project.formatDiagnosticsWithColorAndContext(diagnostics))
  }

  return entrypoint
}

function buildImportsAndModules(sourceFileModules: SourceFileModule[], relativeTo: string) {
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

        break
      }
      case 'Layout/Basic':
      case 'Layout/Environment': {
        layout = [mod, moduleName]

        break
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
        break
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

function runMatcherWithFallback([fallback, fallbackModuleName, layoutModule]: [
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
