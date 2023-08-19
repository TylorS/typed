import * as Effect from '@effect/io/Effect'
import { runMain } from '@effect/platform-node/Runtime'
import { spa } from '@typed/framework/server'
import * as index from 'html:./index'

import { ui } from './routing.js'

spa(index, () => ui, { port: 3000, staticFiles: import.meta.env.PROD }).pipe(
  Effect.tapErrorCause(Effect.logError),
  runMain,
)
