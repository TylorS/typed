/// <reference types="@typed/framework" />

import { addAssetDirectories, run } from '@typed/framework/express'
import express from 'express'
// Express Modules are transform by our vite plugin and expose all of the FetchHandlers
// in the directory as an express.Router at the export 'router'
import * as api from 'express:./api'
// HTML modules are transformed by our vite plugin .
// See @typed/framework/src/HtmlModule.ts to see its full signature.
import * as indexHtml from 'html:./index'
import * as quuxHtml from 'html:./other'
// Runtime modules are transformed by our vite plugin and expose a RuntimeModule.
// See @typed/framework/src/RuntimeModule.ts to see its full signature.
import * as quuxPages from 'runtime:./other-pages'
import * as pages from 'runtime:./pages'
import httpDevServer from 'vavite/http-dev-server'

const app = express()

// Serve static files with express server in production
if (import.meta.env.PROD) {
  addAssetDirectories(app, [indexHtml, quuxHtml], 31536000 /* One Year */)
}

// Register our request handlers

// Register API routes
app.use('/api', api.router)

// The DOM is our API so even on the server, we need to provide the root
// element we should render into.
const getParentElement = (d: Document) => d.getElementById('application')

// Register a route handler
// Here we utilize 'run' from @typed/framework/express which understands how to stitch
// together an express.RouteHandler from a RuntimeModule and a HtmlModule.
// Since our applications define our own routes, we use the splat (*) operator
// to allow our application to handle all routes starting from the base path.
app.get('/other*', run(quuxPages, quuxHtml, getParentElement))

// Register another handler
app.get('/*', run(pages, indexHtml, getParentElement))

// Our vite plugin configures another vite plugin called vavite for you
// anytime it finds your configured server file.
// See: https://github.com/cyco130/vavite
//
// Vavite assists us in running your server in development mode and enabling
// us to easily serve our static assets. This plugin also exposes virtual modules
// which enable yout html modules to be transformed by vite using vavite/vite-dev-server,
// and also enables you to run your server in development mode using vite without needing
// to add middlewares to your express server.

// httpDevServer will resolve to undefined when import.meta.env.PROD is true and be
// dead-code eliminated from your production build.
if (import.meta.env.DEV && httpDevServer) {
  httpDevServer.on('request', app)
  console.log(`listening on at ${JSON.stringify(httpDevServer.address())}`)
} else {
  // Otherwise, start the server for production
  const port = 3000

  app.listen(port, () => console.log(`Server listening on port ${port}.`))
}
