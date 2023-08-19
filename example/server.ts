import * as Duration from '@effect/data/Duration'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Http from '@effect/platform-node/HttpServer'
import { runMain } from '@effect/platform-node/Runtime'
import { cacheControl, renderHtml, serve, staticFileMiddleware } from '@typed/framework/server'
import * as index from 'html:./index'
import { assetDirectory, clientOutputDirectory } from 'typed:config'

import { ui } from './routing.js'

const app = Http.router.empty.pipe(
  Http.router.get(
    '/*',
    renderHtml(index, () => ui),
  ),
  staticFileMiddleware({
    enable: import.meta.env.PROD,
    directory: clientOutputDirectory,
    include: [`${assetDirectory}/**/*`],
    setHeaders: cacheControl({
      maxAge: Duration.days(365),
      immutable: true,
      etag: true,
    }),
  }),
)

const server = serve(app, { port: 3000 })

Layer.launch(server).pipe(Effect.tapErrorCause(Effect.logError), runMain)
