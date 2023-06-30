/// <reference types="@typed/framework" />

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import { flow, pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { renderToHtml, renderToHtmlStream, server } from '@typed/html/server'
import * as Router from '@typed/router'
import express from 'express'
import staticGzip from 'express-static-gzip'
import { clientOutputDirectory } from 'typed:config'
import httpDevServer from 'vavite/http-dev-server'
import viteDevServer from 'vavite/vite-dev-server'

import { layout, router } from './routing.js'

const dir = dirname(fileURLToPath(import.meta.url))

const indexHtml = import.meta.env.PROD
  ? readFileSync(`${clientOutputDirectory}/index.html`, 'utf-8').toString()
  : readFileSync(join(dir, './index.html'), 'utf-8').toString()
const [appElementStart, appElementEnd] = [`<div id="application">`, `</div>`]
const [before, after] = indexHtml.split(appElementStart + appElementEnd)

const app: express.Express = express()

const ui = layout(router)
const uiStream = renderToHtmlStream(ui)
const uiHtml = renderToHtml(ui)

const writeToResponse = (res: express.Response) => (chunk: string) =>
  Effect.sync(() => res.write(chunk))

const renderContext = Effect.provideSomeLayer(server())

const provideUiResources = (req: express.Request) => {
  return flow(
    Effect.provideSomeLayer(Router.memory({ initialUrl: new URL(req.url, 'https://localhost') })),
    renderContext,
    Effect.scoped,
  )
}

if (import.meta.env.PROD) {
  const serveStatic = staticGzip(clientOutputDirectory, {
    serveStatic: {
      maxAge: '1y',
      immutable: true,
    },
  })

  app.use((req, res, next) => {
    // Don't render index.html from static files here
    if (req.url === '/') return next()

    return serveStatic(req, res, next)
  })
}

app.get('*', async (req, res, next) => {
  console.log('handling', req.url)
  const start = Date.now()

  try {
    if (viteDevServer) {
      // In dev mode we unfortunately have to utilize full-html transformation with vite
      let html = before + appElementStart
      html += await pipe(uiHtml, provideUiResources(req), Effect.runPromise)
      html += appElementEnd + after
      html = await viteDevServer.transformIndexHtml(req.url, html)

      res.status(200)
      res.type('text/html')
      res.end(html)
    } else {
      res.type('text/html')
      res.write(before + appElementStart)

      await pipe(
        uiStream,
        Fx.observe(writeToResponse(res)),
        provideUiResources(req),
        Effect.runPromise,
      )

      res.status(200)
      res.end(appElementEnd + after)
      console.log('rendered in', Date.now() - start, 'ms')
    }
  } catch (error) {
    console.error(error)
    next(error)
  }
})

if (viteDevServer) {
  httpDevServer?.on('request', app)
} else {
  console.log('Starting production server')
  app.listen(3000)
}
