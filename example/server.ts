import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Http from '@effect/platform-node/HttpServer'
import { runMain } from '@effect/platform-node/Runtime'
import { renderHtml, serve, staticFileMiddleware } from '@typed/framework/server'
import * as index from 'html:./index'
import { clientOutputDirectory } from 'typed:config'

import { ui } from './routing.js'

const app = Http.router.empty.pipe(
  Http.router.get(
    '/*',
    renderHtml(index, () => ui),
  ),
  staticFileMiddleware({
    directory: clientOutputDirectory,
    include: ['assets/**/*'],
    enable: import.meta.env.PROD,
  }),
)

const server = serve(app, { port: 3000 })

Layer.launch(server).pipe(Effect.tapErrorCause(Effect.logError), runMain)
