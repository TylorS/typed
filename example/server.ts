import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Http from '@effect/platform-node/HttpServer'
import { runMain } from '@effect/platform-node/Runtime'
import { renderHtml, serve } from '@typed/framework/server/server'
import * as index from 'html:./index'

import { layout, router } from './routing.js'

const ui = layout(router)

const HttpLive = Http.router.empty.pipe(
  Http.router.get(
    '/*',
    renderHtml(index, () => ui),
  ),
  serve,
)

Layer.launch(HttpLive).pipe(Effect.tapErrorCause(Effect.logError), runMain)
