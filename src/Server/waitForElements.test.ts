import { deepStrictEqual, notDeepStrictEqual, ok } from 'assert'

import * as Effect from '@effect/core/io/Effect'
import * as Fiber from '@effect/core/io/Fiber'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { getDocument } from '../DOM/Document.js'

import { waitForElements } from './waitForElements.js'

import { html, renderInto } from '@/HTML/index.js'
import { provideServerEnvironment } from '@/Server/DomServices.js'

describe(import.meta.url, () => {
  describe(waitForElements.name, () => {
    it('allows waiting for elements to become available to the DOM', async () => {
      const template = html`<div id="parent">
        ${pipe(
          html`<div id="child"></div>`,
          Fx.delay(millis(10)),
          Fx.merge(html`<div>Loading...</div>`),
        )}
      </div>`

      const test = pipe(
        Effect.gen(function* ($) {
          const document = yield* $(getDocument)

          // Render into the document
          const fiber = yield* $(
            pipe(template, renderInto(document.body), waitForElements('#child'), Effect.fork),
          )

          // allow render to start
          yield* $(Effect.yieldNow)

          const parent = document.querySelector('#parent')

          // Verify initial render is what we expect
          ok(parent)
          ok(parent.innerHTML.includes('Loading...'))
          deepStrictEqual(document.querySelector('#child'), null)

          // Wait for the fiber to complete
          yield* $(Fiber.join(fiber))

          // Verify final render is what we expect
          notDeepStrictEqual(document.querySelector('#child'), null)
        }),
        provideServerEnvironment,
      )

      await Effect.unsafeRunPromise(test)
    })
  })
})
