import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { render } from '@typed/html/browser'

import { Live } from './infrastructure.js'
import { TodoApp } from './presentation.js'

const rootElement = document.getElementById('application')

if (!rootElement) {
  throw new Error('Unable to find root element #application')
}

pipe(TodoApp, render, Fx.provideSomeLayer(Live), Fx.drain, Effect.scoped, Effect.runFork)
