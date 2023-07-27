/// <reference types="@typed/framework" />

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { server } from '@typed/framework/server'
import * as Fx from '@typed/fx'
import { renderToHtml, renderToHtmlStream } from '@typed/html/server'
import express from 'express'
import staticGzip from 'express-static-gzip'
import * as index from 'html:./index'
import { clientOutputDirectory } from 'typed:config'
import httpDevServer from 'vavite/http-dev-server'
import viteDevServer from 'vavite/vite-dev-server'
import { ViteDevServer } from 'vite'

import { layout, router } from './routing.js'

const app: express.Express = express()

const ui = layout(router)
const uiStream = renderToHtmlStream(ui)
const uiHtml = renderToHtml(ui)

const writeToResponse = (res: express.Response) => (chunk: string) =>
  Effect.sync(() => res.write(chunk))

const provideUiResources = (req: express.Request) => {
  return <R, E, A>(effect: Effect.Effect<R, E, A>) =>
    pipe(
      effect,
      Effect.provideSomeLayer(server({ initialUrl: new URL(req.url, 'https://localhost') })),
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

  try {
    if (viteDevServer) {
      await runDev(req, res, viteDevServer)
    } else {
      await runProd(req, res)
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

// In dev mode we unfortunately have to utilize full-html transformation with vite
async function runDev(req: express.Request, res: express.Response, devServer: ViteDevServer) {
  res.type('text/html')

  let html = index.before
  html += await pipe(uiHtml, provideUiResources(req), Effect.runPromise)
  html += index.after
  html = await devServer.transformIndexHtml(req.url, html)

  res.status(200)
  res.end(html)
}

async function runProd(req: express.Request, res: express.Response) {
  res.type('text/html')
  res.write(index.before)

  await pipe(uiStream, Fx.observe(writeToResponse(res)), provideUiResources(req), Effect.runPromise)

  res.status(200)
  res.end(index.after)
}
