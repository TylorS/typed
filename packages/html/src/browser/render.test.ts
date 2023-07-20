import { deepStrictEqual, ok } from 'assert'

import * as Duration from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { GlobalThis, makeDomServices } from '@typed/dom'
import * as Fx from '@typed/fx'
import { isWire } from '@typed/wire'
import { describe, it } from 'vitest'

import { attrDirective } from '../Directive.js'
import { RenderContext, makeRenderContext } from '../RenderContext.js'
import { RenderEvent } from '../RenderEvent.js'
import { html } from '../RenderTemplate.js'
import { Rendered } from '../Rendered.js'
import { TYPED_HOLE } from '../meta.js'
import { makeServerWindow } from '../server/makeServerWindow.js'
import { counter } from '../test_components.test.js'

import { render } from './render.js'

describe(render.name, () => {
  it.concurrent.only('renders a simple elements', async () => {
    const test = testRendered(html`<div></div>`, (rendered) =>
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual(rendered.outerHTML, '<div></div>')
      }),
    )

    await Effect.runPromise(test)
  })

  it.concurrent('renders a simple elements with attributes', async () => {
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

  it.concurrent('renders interpolated templates', async () => {
    const test = testRendered(html`<div>${html`<span></span>`}</div>`, (rendered) =>
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual(rendered.outerHTML, `<div><span></span>${TYPED_HOLE(0)}</div>`)
      }),
    )

    await Effect.runPromise(test)
  })

  it.concurrent('renders sparse attributes ', async () => {
    const test = testRendered(html`<div id="${'foo'} ${'bar'} ${'baz'}"></div>`, (rendered) =>
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual(rendered.outerHTML, '<div id="foo bar baz"></div>')
      }),
    )

    await Effect.runPromise(test)
  })

  it.concurrent('renders sparse attributes with directives', async () => {
    const test = testRendered(
      html`<div
        id="${attrDirective((part) => part.update('foo'))} ${attrDirective((part) =>
          part.update('bar'),
        )}"
      ></div>`,
      (rendered) =>
        Effect.gen(function* ($) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered instanceof globalThis.HTMLDivElement)
          deepStrictEqual(rendered.outerHTML, '<div id="foo bar"></div>')
        }),
    )

    await Effect.runPromise(test)
  })

  it.concurrent('renders components with wires', async () => {
    const test = testRendered(counter, (rendered) =>
      // eslint-disable-next-line require-yield
      Effect.gen(function* ($) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered && isWire(rendered))
        const { childNodes } = rendered.valueOf()

        deepStrictEqual(childNodes.length, 3)

        ok(childNodes[0] instanceof globalThis.HTMLButtonElement)
        ok(childNodes[1] instanceof globalThis.HTMLSpanElement)
        ok(childNodes[2] instanceof globalThis.HTMLButtonElement)
      }),
    )

    await Effect.runPromise(test)
  })
})

function testRendered<R, E, R2, E2>(
  what: Fx.Fx<R, E, RenderEvent>,
  onRendered: (rendered: Rendered) => Effect.Effect<R2, E2, unknown>,
  take = 1,
) {
  const window = makeServerWindow()
  const where = window.document.body

  const test = pipe(
    render(what),
    Fx.take(take),
    Fx.observe((event) => {
      console.log('Rendered in', Date.now() - start, 'ms')
      return onRendered(event.valueOf() as Rendered)
    }),
    Effect.provideSomeContext(makeDomServices({ window, globalThis: window, rootElement: where })),
    Effect.provideSomeLayer(RenderContext.layerOf(makeRenderContext({ environment: 'browser' }))),
    Effect.scoped,
  )

  const start = Date.now()

  return test
}
