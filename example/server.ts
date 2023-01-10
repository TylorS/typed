/// <reference types="@typed/framework" />

import { addAssetDirectories, run } from '@typed/framework/express'
import express from 'express'
// HTML modules are transformed by our vite plugin .
// See @typed/framework/src/HtmlModule.ts to see its full signature.
import * as index from 'html:./index'
import * as quuxHtml from 'html:./quux'
// Runtime modules are transformed by our vite plugin and expose an RuntimeModule.
// See @typed/framework/src/RuntimeModule.ts to see its full signature.
import * as pages from 'runtime:./pages'
import * as quuxPages from 'runtime:./quux-pages'
import httpDevServer from 'vavite/http-dev-server'

const app = express()

// Serve static files with express server in production
if (import.meta.env.PROD) {
  addAssetDirectories(app, [index, quuxHtml], 31536000 /* One Year */)
}

// Register our request handlers

// The DOM is our API so even on the server, we need to provide the root
// element we should render into.
const getParentElement = (d: Document) => d.getElementById('application')

// Register an route handler
// Here we utilize @typed/compiler's runExpressApp when understands how to stitch
// together an express.RouteHandler from a RuntimeModule and a HtmlModule.
// Since our applications define our own routes, we use the splat (*) operator
// to allow our application to handle any route that doesn't match the other
app.get('/quux*', run(quuxPages, quuxHtml, getParentElement))

// Register another handler
app.get('/*', run(pages, index, getParentElement))

// Our vite plugin configures another vite plugin called vavite for you
// anytime it finds your configured server file.
// See: https://github.com/cyco130/vavite
//
// Vavite assists us in running your server in development mode and enabling
// us to easily serve our static assets. This plugin also exposes virtual modules
// which enable yout html modules to be transformed by vite using vavite/vite-dev-server,
// and also enables you to run your server in development mode.

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
