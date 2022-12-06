/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { deepStrictEqual } from 'assert'

import { testClock } from '@effect/core'
import * as Effect from '@effect/core/io/Effect'
import { TestEnvironment } from '@effect/core/testing/TestEnvironment'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'
import * as happyDom from 'happy-dom'

import { Document } from '../DOM/Document.js'

import { RenderContext } from './RenderContext.js'
import { stripHoleComments } from './parseTemplate.js'
import { render, renderInto } from './render.js'
import { html } from './Fx.js'

describe(import.meta.url, () => {
  describe(render.name, () => {
    it('renders a simple div', async () => {
      const { document } = new happyDom.Window() as unknown as Window
      const root = document.createElement('div')

      const delay = millis(100)
      const value = pipe(
        Fx.periodic(delay),
        Fx.scan(0, (acc) => acc + 1),
        Fx.take(4),
      )

      const test = pipe(
        Effect.gen(function* ($) {
          // Start rendering Fiber
          yield* $(
            pipe(html`<div>Hello ${value}!</div>`, renderInto(root), Fx.runDrain, Effect.fork),
          )

          yield* $(Effect.yieldNow) // Allow first render to take place

          deepStrictEqual(stripHoleComments(root.innerHTML), '<div>Hello 0!</div>')

          yield* $(testClock.adjust(delay))

          deepStrictEqual(stripHoleComments(root.innerHTML), '<div>Hello 1!</div>')

          yield* $(testClock.adjust(delay))

          deepStrictEqual(stripHoleComments(root.innerHTML), '<div>Hello 2!</div>')

          yield* $(testClock.adjust(delay))

          deepStrictEqual(stripHoleComments(root.innerHTML), '<div>Hello 3!</div>')

          yield* $(testClock.adjust(delay))

          // Should not render after take(4)
          deepStrictEqual(stripHoleComments(root.innerHTML), '<div>Hello 3!</div>')
        }),
        RenderContext.provideClient,
        Effect.provideService(Document.Tag, document),
        Effect.provideLayer(TestEnvironment),
      )

      await Effect.unsafeRunPromise(test)
    })
  })
})
