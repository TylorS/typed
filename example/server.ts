// For support of our virtual modules
/// <reference types="@typed/framework" />

import { join } from 'path'

// @typed/framework provide a facade for express, where "import express from express"
// is re-exported at 'express', and it provides additional features for working with our virtual modules.
import * as express from '@typed/framework/express'
// Express Modules are transform by our vite plugin and expose all of the FetchHandlers
// in the directory as an express.Router at the export 'router'
import * as api from 'express:./api'
// HTML modules are transformed by our vite plugin .
// See @typed/framework/src/HtmlModule.ts to see its full signature.
import * as indexHtml from 'html:./index'
import * as otherHtml from 'html:./other'
// Runtime modules are transformed by our vite plugin and expose a RuntimeModule.
// See @typed/framework/src/RuntimeModule.ts to see its full signature.
import * as otherPages from 'runtime:./other-pages'
import * as pages from 'runtime:./pages'
// The resolved configuration from our vite plugin can be accessed as a typed module.
import * as config from 'typed:config'
// Our vite plugin configures vavite to expose the httpDevServer in development.
import httpDevServer from 'vavite/http-dev-server'

const app = express.express()

// Serve static files with express server in production
if (import.meta.env.PROD) {
  app.use(
    config.base, // Optional if you do not need to set config.base in your vite config
    ...express.assets(import.meta.url, [indexHtml, otherHtml], {
      serveStatic: { maxAge: 31536000, cacheControl: true },
    }),
  )
}

// Register our request handlers

// Register API routes
app.use('/api', api.router)

// The DOM is our API even on the server, we need to provide the root
// element we should render into.
const getParentElement = (d: Document) => d.getElementById('application')

// Create our express handlers
const otherHandler = express.run(otherPages, otherHtml, getParentElement)
const indexHandler = express.run(pages, indexHtml, getParentElement)

// Register our html handlers
// It is optional to use config.base, but if you need to set config.base in your vite config, it can be useful.
app.get(join(config.base, '/*'), (req, res, next) =>
  req.url.includes('/other') ? otherHandler(req, res, next) : indexHandler(req, res, next),
)

// Start the server properly in development and production
express.listen(app, httpDevServer, { port: 3000 })
