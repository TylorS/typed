import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Logger from '@effect/io/Logger'
import * as LogLevel from '@effect/io/Logger/Level'
import { browser } from '@typed/framework/browser'
import * as Fx from '@typed/fx'
import { hydrate } from '@typed/html/browser'

import { layout, router } from './routing.js'

// Bootstrap running application
const rootElement = document.getElementById('application')

if (!rootElement) {
  throw new Error('Could not find #application element')
}

// Provide resources to the program
const program = pipe(
  layout(router),
  hydrate,
  Fx.drain,
  Effect.provideSomeLayer(browser(window, { rootElement })),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.scoped,
)

Effect.runFork(program)
