/// <reference types="@typed/framework" />

import { fileURLToPath } from 'url'

import { runExpressApp } from '@typed/compiler'
import express from 'express'
import staticGzip from 'express-static-gzip'
import * as index from 'typed:html:./index.html'
import * as quuxHtml from 'typed:html:./quux.html'
import * as pages from 'typed:runtime:./pages'
import * as quuxPages from 'typed:runtime:./quux-pages'
import httpDevServer from 'vavite/http-dev-server'
import { join } from 'path'

const app = express()

// Serve static files with express server
if (index.assetDirectory && import.meta.env.PROD) {
  const ONE_YEAR = 31536000
  const assetDirectory = fileURLToPath(new URL(index.assetDirectory, import.meta.url))

  console.log(`Serving static assets from ${assetDirectory}`)

  app.use('/assets', staticGzip(join(assetDirectory, 'assets'), { serveStatic: { maxAge: ONE_YEAR, cacheControl: true } }))
}

// Register our request handler
app.get(
  '/quux*',
  runExpressApp(quuxPages, quuxHtml, (d) => d.getElementById('application')),
)

// Register our request handler
app.get(
  '/*',
  runExpressApp(pages, index, (d) => d.getElementById('application')),
)

if (httpDevServer) {
  // If we're in development, use vite's http server
  httpDevServer.on('request', app)
  console.log('Using vite http server.')
} else {
  const port = import.meta.env.VITE_PORT ? parseInt(import.meta.env.VITE_PORT, 10) : 3000

  // Otherwise, start the server
  app.listen(port, () => console.log(`Server listening on port ${port}.`))
}
