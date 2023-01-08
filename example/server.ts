/// <reference types="@typed/framework" />

import { runExpressApp } from '@typed/compiler'
import express from 'express'
import staticGzip from 'express-static-gzip'
import * as index from 'typed:html:./index.html'
import * as pages from 'typed:modules:./pages'
import httpDevServer from 'vavite/http-dev-server'

// App here is "just" an express app, use it as you would any other express app.

const app = express()

// Serve static files with express server
if (index.assetDirectory && import.meta.env.PROD) {
  const ONE_YEAR = 31536000

  app.use(
    staticGzip(new URL(index.assetDirectory, import.meta.url).pathname, {
      serveStatic: { maxAge: ONE_YEAR, cacheControl: true },
    }),
  )
}

// Register our request handler
app.get('/', runExpressApp(pages, index.html))

if (httpDevServer) {
  // If we're in development, use vite's http server
  httpDevServer.on('request', app)
} else {
  // Otherwise, start the server
  app.listen(3000, () => console.log('Server listening on port 3000'))
}
