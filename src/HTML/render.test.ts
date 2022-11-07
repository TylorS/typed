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
import { render } from './render.js'
import { html } from './tag.js'

describe(import.meta.url, () => {
  describe(render.name, () => {
    it('should render a simple div', async () => {
      const { document } = new happyDom.Window() as unknown as Window

      const delay = millis(100)
      const value = pipe(
        Fx.periodic(delay),
        Fx.scan(0, (acc) => acc + 1),
        Fx.take(4),
      )

      const test = pipe(
        Effect.gen(function* ($) {
          yield* $(
            pipe(
              html`<div>Hello ${value}!</div>`,
              Fx.scanEffect(document.body, render),
              Fx.runDrain,
              Effect.fork,
            ),
          )

          deepStrictEqual(document.body.innerHTML, '<div>Hello 0<!--fphtmlX0-->!</div>')

          yield* $(testClock.adjust(delay))

          deepStrictEqual(document.body.innerHTML, '<div>Hello 1<!--fphtmlX0-->!</div>')

          yield* $(testClock.adjust(delay))

          deepStrictEqual(document.body.innerHTML, '<div>Hello 2<!--fphtmlX0-->!</div>')

          yield* $(testClock.adjust(delay))

          deepStrictEqual(document.body.innerHTML, '<div>Hello 3<!--fphtmlX0-->!</div>')

          yield* $(testClock.adjust(delay))

          // Should not render after take(4)
          deepStrictEqual(document.body.innerHTML, '<div>Hello 3<!--fphtmlX0-->!</div>')
        }),
        RenderContext.provide,
        Effect.provideService(Document.Tag, document),
        Effect.provideLayer(TestEnvironment),
      )

      await Effect.unsafeRunPromise(test)
    })
  })
})
