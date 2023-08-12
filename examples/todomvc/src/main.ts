import './styles.css'

import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Logger from '@effect/io/Logger'
import * as LogLevel from '@effect/io/Logger/Level'
import * as Fx from '@typed/fx'
import { render } from '@typed/html/browser'

import { Live } from './infrastructure.js'
import { TodoApp } from './presentation.js'

const rootElement = document.getElementById('todoapp')

if (!rootElement) {
  throw new Error('Unable to find root element #todoapp')
}

pipe(
  render(TodoApp),
  Fx.provideSomeLayer(Live),
  Fx.drain,
  Effect.scoped,
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.runPromiseExit,
).then(console.log)
