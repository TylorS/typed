/// <reference types="vite/client" />

import { readFileSync } from 'fs'

import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { runDrain, take } from '@typed/fx'
import express from 'express'
import httpDevServer from 'vavite/http-dev-server'
import viteDevServer from 'vavite/vite-dev-server'

import { provideDomServices } from '../src/DOM/DomServices.js'
import { RenderContext, renderInto } from '../src/HTML/index.js'
import * as Router from '../src/Router/Router.js'
import { makeServerWindow } from '../src/Server/DOMServices.js'

import { main } from './main'

const app = express()

const fileUrl = new URL(import.meta.url)
const indexHtmlPath = new URL('./index.html', fileUrl).pathname

const indexHtml = readFileSync(indexHtmlPath, 'utf-8').toString()

app.use(async (req, res, next) => {
  try {
    const window = makeServerWindow({
      url: new URL(
        req.url,
        req.protocol + '://' + (req.get('x-forwarded-host') || req.get('host')),
      ).toString(),
    })

    window.document.documentElement.outerHTML = indexHtml

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const app = window.document.getElementById('app')!

    await pipe(
      main,
      renderInto(app),
      take(1), // Could be replaced with any other means of determining when rendering is complete
      runDrain,
      RenderContext.provideServer,
      Effect.provideSomeLayer(Router.routerLayer),
      provideDomServices(window),
      Effect.unsafeRunPromise,
    )

    let html = window.document.documentElement.outerHTML

    if (import.meta.env.DEV && viteDevServer) {
      html = await viteDevServer.transformIndexHtml(req.url, html)
    }

    res.send('<!DOCTYPE html>' + html)
  } catch (err) {
    if (import.meta.env.DEV && viteDevServer) {
      viteDevServer.ssrFixStacktrace(err)
    }

    next(err)
  }
})

if (httpDevServer) {
  httpDevServer.on('request', app)
} else {
  app.listen(3000, () => {
    console.log('listening')
  })
}
