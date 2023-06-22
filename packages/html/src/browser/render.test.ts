import { deepStrictEqual, ok } from 'assert'

import * as Duration from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { GlobalThis, makeDomServices } from '@typed/dom'
import * as Fx from '@typed/fx'
import { describe, it } from 'vitest'

import { RenderContext, makeRenderContext } from '../RenderContext.js'
import { html } from '../RenderTemplate.js'
import { Rendered } from '../Rendered.js'
import { TemplateResult } from '../TemplateResult.js'
import { TYPED_HOLE } from '../meta.js'
import { makeServerWindow } from '../server/makeServerWindow.js'

import { render } from './render.js'

describe(render.name, () => {
  it('renders a simple elements', async () => {
    const test = testRendered(html`<div></div>`, (rendered) =>
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual(rendered.outerHTML, '<div></div>')
      }),
    )

    await Effect.runPromise(test)
  })

  it('renders a simple elements with attributes', async () => {
    const staticAttr = testRendered(html`<div id="test"></div>`, (rendered) =>
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual(rendered.outerHTML, '<div id="test"></div>')
      }),
    )

    const staticPart = testRendered(html`<div id=${'test'}></div>`, (rendered) =>
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual(rendered.outerHTML, '<div id="test"></div>')
      }),
    )

    const effectPart = testRendered(html`<div id=${Effect.succeed('test')}></div>`, (rendered) =>
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual(rendered.outerHTML, '<div id="test"></div>')
      }),
    )

    const fxPart = testRendered(
      html`<div id=${Fx.at('test', Duration.millis(10))}></div>`,
      (rendered) =>
        Effect.gen(function* ($) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered instanceof globalThis.HTMLDivElement)
          deepStrictEqual(rendered.outerHTML, '<div id="test"></div>')
        }),
    )

    await Promise.all([staticAttr, staticPart, effectPart, fxPart].map(Effect.runPromise))
  })

  it('renders interpolated templates', async () => {
    const test = testRendered(html`<div>${html`<span></span>`}</div>`, (rendered) =>
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual(rendered.outerHTML, `<div><span></span>${TYPED_HOLE(0)}</div>`)
      }),
    )

    await Effect.runPromise(test)
  })
})

function testRendered<R, E, R2, E2>(
  what: Fx.Fx<R, E, TemplateResult>,
  onRendered: (rendered: Rendered | null) => Effect.Effect<R2, E2, unknown>,
  take = 1,
) {
  const window = makeServerWindow()
  const where = window.document.body

  return pipe(
    render(what, where),
    Fx.take(take),
    Fx.observe(onRendered),
    Effect.provideSomeContext(makeDomServices(window, window)),
    RenderContext.provide(makeRenderContext('browser')),
    Effect.scoped,
  )
}