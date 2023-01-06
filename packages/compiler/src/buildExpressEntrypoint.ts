import { EOL } from 'os'
import { dirname } from 'path'

import type { Project } from 'ts-morph'

import { SourceFileModule } from './SourceFileModule.js'
import { buildImportsAndModules, runMatcherWithFallback } from './helpers.js'

// TODO: Need to allow adding custom middlewares - should we expose the server via a virtual module?
// TODO: Need to setup a proper fallback URL for the server-side instead of using runPages

export function buildExpressEntrypoint(
  sourceFileModules: SourceFileModule[],
  project: Project,
  outFile: string,
) {
  const [imports, modules, fallback] = buildImportsAndModules(sourceFileModules, dirname(outFile))
  const shouldImportForEnvironment = modules.some((x) => x.includes('provideLayer'))
  const shouldImportModule = modules.length > 0

  const entrypoint = project.createSourceFile(
    outFile,
    `/* This file was auto-generated by @typed/compiler */

import { join } from 'path'

import * as F from '@fp-ts/data/Function'
import { readIndexHtml, getClientDirectory, runExpressApp } from '@typed/compiler'
import { ${shouldImportModule ? 'Module, ' : ''}buildModules } from '@typed/framework'
${shouldImportForEnvironment ? EOL + `import * as Fx from '@typed/fx'` : ''}
${shouldImportForEnvironment ? EOL + `import * as Route from '@typed/route'` : ''}
import express from 'express'
import expressStaticGzip from 'express-static-gzip'
import httpDevServer from 'vavite/http-dev-server'
${imports.join(EOL)}

export const app: express.Express = express()
export const clientDirectory = getClientDirectory(import.meta.url)

export function staticGzip(options: expressStaticGzip.ExpressStaticGzipOptions): express.RequestHandler {
  return expressStaticGzip(clientDirectory, options)
}

export const modules = [
  ${modules.join(',' + EOL + '  ')}
]

export const matcher = buildModules(modules)

export const main = ${fallback ? runMatcherWithFallback(fallback) : `matcher.run`}

export const indexHtml: string = readIndexHtml(join(clientDirectory, 'index.html'))

export const requestHandler: express.RequestHandler = runExpressApp(main, indexHtml)

export const listen = (...args: ArgsOf<typeof app['listen']>) => {
  if (httpDevServer) {
    httpDevServer.on('request', app)
  } else {
    app.listen(...args)
  }
}

type ArgsOf<T> = T extends (...args: infer A) => any ? A : never
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
