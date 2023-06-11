import { fileURLToPath } from 'url'

import * as Effect from '@effect/io/Effect'
import { describe, expect, it } from 'vitest'

import { html } from './RenderTemplate.js'
import { testHtml, testHtmlEvents } from './_test-utils.js'
import { FullHtml, renderToHtml, renderToHtmlStream } from './renderHtml.js'

describe(fileURLToPath(import.meta.url), () => {
  describe(renderToHtmlStream.name, () => {
    it('renders a simple html element', async () => {
      const test = Effect.gen(function* ($) {
        yield* $(testHtmlEvents(html`<div></div>`, [new FullHtml(`<div data-typed="-1"></div>`)]))
      })

      await Effect.runPromise(test)
    })

    it('renders a simple html element with attributes', async () => {
      const test = Effect.gen(function* ($) {
        yield* $(
          testHtmlEvents(html`<div id="test"></div>`, [
            new FullHtml(`<div data-typed="-1" id="test"></div>`),
          ]),
        )
      })

      await Effect.runPromise(test)
    })
  })

  describe(renderToHtml.name, () => {
    it('renders a simple html element', async () => {
      const test = Effect.gen(function* ($) {
        const output = yield* $(testHtml(html`<div></div>`))

        expect(output).toEqual(`<div data-typed="-1"></div>`)
      })

      await Effect.runPromise(test)
    })
  })
})
