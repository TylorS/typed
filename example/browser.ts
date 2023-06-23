import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { browser, hydrate } from '@typed/html/browser'
import * as Router from '@typed/router'

import { layout, router } from './routing.js'

// Bootstrap running application
const parentElement = document.getElementById('application')

if (!parentElement) {
  throw new Error('Could not find #application element')
}

const ui = hydrate(layout(router), parentElement)

// Provide resources to the program
const program = pipe(
  ui,
  Fx.drain,
  Effect.provideSomeLayer(Router.dom()),
  Effect.provideSomeLayer(browser(window)),
  Effect.scoped,
)

Effect.runFork(program)
