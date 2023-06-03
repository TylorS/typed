import { deepStrictEqual, ok } from 'assert'

import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import { GlobalThis } from '@typed/dom'
import * as Fx from '@typed/fx'
import { describe, it } from 'vitest'

import {
  attrDirective,
  classNameDirective,
  dataDirective,
  eventDirective,
  propertyDirective,
  refDirective,
} from './Directive.js'
import { makeElementRef } from './ElementRef.js'
import { EventHandler } from './EventHandler.js'
import { html } from './RenderTemplate.js'
import { testRenderTemplate } from './_test-utils.js'

describe(import.meta.url, () => {
  it('renders a simple html element', async () => {
    const test = testRenderTemplate(html`<div></div>`, function* ($, rendered) {
      const globalThis = yield* $(GlobalThis)

      ok(rendered instanceof globalThis.HTMLDivElement)
      ok(rendered.outerHTML === '<div></div>')
    })

    await Effect.runPromise(test)
  })

  it('renders a simple html element with attributes', async () => {
    const test = testRenderTemplate(html`<div id="test"></div>`, function* ($, rendered) {
      const globalThis = yield* $(GlobalThis)

      ok(rendered instanceof globalThis.HTMLDivElement)
      ok(rendered.outerHTML === '<div id="test"></div>')
    })

    await Effect.runPromise(test)
  })

  it('renders a simple html element with attributes and text', async () => {
    const test = testRenderTemplate(html`<div id="test">Hello</div>`, function* ($, rendered) {
      const globalThis = yield* $(GlobalThis)

      ok(rendered instanceof globalThis.HTMLDivElement)
      ok(rendered.outerHTML === '<div id="test">Hello</div>')
    })

    await Effect.runPromise(test)
  })

  it('renders a simple html element with interpolated attributes', async () => {
    const test = testRenderTemplate(
      html`<div
        id="${'test'}"
        class="${Effect.succeed('foo')}"
        style="${Fx.succeed('color:blue;')}"
      ></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.outerHTML === '<div id="test" class="foo" style="color:blue;"></div>')
      },
    )

    await Effect.runPromise(test)
  })

  it('handles boolean attributes', async () => {
    const synchronous = testRenderTemplate(
      html`<div ?disabled=${true}></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.outerHTML === '<div disabled=""></div>')
      },
    )

    await Effect.runPromise(synchronous)

    const effect = testRenderTemplate(
      html`<div ?disabled=${Effect.succeed(true)}></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.outerHTML === '<div disabled=""></div>')
      },
    )

    await Effect.runPromise(effect)

    const fx = testRenderTemplate(
      html`<div ?disabled=${Fx.succeed(true)}></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.outerHTML === '<div disabled=""></div>')
      },
    )

    await Effect.runPromise(fx)
  })

  it('allows using directives to manage attributes', async () => {
    const test = testRenderTemplate(
      html`<div id=${attrDirective((part) => part.update('foo'))}></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.outerHTML === '<div id="foo"></div>')
      },
    )

    await Effect.runPromise(test)
  })

  it('allows using directives to manage attributes allows multiple updates', async () => {
    const test = testRenderTemplate(
      html`<div
        id=${attrDirective((part) => Effect.all(part.update('foo'), part.update('bar')))}
      ></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.outerHTML === '<div id="bar"></div>')
      },
    )

    await Effect.runPromise(test)
  })

  it('allows using directive to manage class names', async () => {
    const updateTest = testRenderTemplate(
      html`<div class=${classNameDirective((part) => part.update('foo'))}></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.outerHTML === '<div class="foo"></div>')
      },
    )

    await Effect.runPromise(updateTest)

    const addRemoveTest = testRenderTemplate(
      html`<div
        class=${classNameDirective((part) =>
          Effect.gen(function* ($) {
            yield* $(part.add('foo', 'bar'))
            yield* $(part.remove('foo'))
            yield* $(part.toggle('baz', 'quux'))
            yield* $(part.toggle('quux'))
          }),
        )}
      ></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.outerHTML === '<div class="bar baz"></div>')
      },
    )

    await Effect.runPromise(addRemoveTest)
  })

  it('sets data attributes', async () => {
    const attribute = testRenderTemplate(
      html`<div data-test="foo"></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.dataset.test === 'foo')
      },
    )

    await Effect.runPromise(attribute)

    const object = testRenderTemplate(
      html`<div .data=${{ test: 'foo' }}></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.dataset.test === 'foo')
      },
    )

    await Effect.runPromise(object)

    const directive = testRenderTemplate(
      html`<div .data=${dataDirective((part) => part.update({ test: 'foo' }))}></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        ok(rendered.dataset.test === 'foo')
      },
    )

    await Effect.runPromise(directive)
  })

  it('sets properties', async () => {
    // Using a value
    const property = testRenderTemplate(html`<div .test=${'foo'}></div>`, function* ($, rendered) {
      const globalThis = yield* $(GlobalThis)

      ok(rendered instanceof globalThis.HTMLDivElement)
      deepStrictEqual((rendered as any).test, 'foo')
    })

    await Effect.runPromise(property)

    // Using a directive
    const directive = testRenderTemplate(
      html`<div .test=${propertyDirective((part) => part.update('foo'))}></div>`,
      function* ($, rendered) {
        const globalThis = yield* $(GlobalThis)

        ok(rendered instanceof globalThis.HTMLDivElement)
        deepStrictEqual((rendered as any).test, 'foo')
      },
    )

    await Effect.runPromise(directive)
  })

  it('manages references', async () => {
    const test = Effect.gen(function* ($) {
      const ref = yield* $(makeElementRef<HTMLDivElement>())

      // Using the ref directly
      yield* $(
        testRenderTemplate(html`<div ref=${ref}></div>`, function* ($, rendered) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered instanceof globalThis.HTMLDivElement)

          const element = yield* $(ref.getElement)

          ok(element === rendered)
        }),
      )

      // Using a directive
      yield* $(
        testRenderTemplate(
          html`<div ref=${refDirective((part) => part.update(ref))}></div>`,
          function* ($, rendered) {
            const globalThis = yield* $(GlobalThis)

            ok(rendered instanceof globalThis.HTMLDivElement)

            const element = yield* $(ref)

            ok(Option.isSome(element))
            ok(element.value === rendered)
          },
        ),
      )
    })

    await Effect.runPromise(test)
  })

  it('manages event listeners', async () => {
    const test = Effect.gen(function* ($) {
      const value = yield* $(Fx.makeRef(Effect.succeed(0)))
      const listener = EventHandler(() => value.update((n) => n + 1))

      // Using @ syntax
      yield* $(
        testRenderTemplate(html`<div @click=${listener}></div>`, function* ($, rendered, dispatch) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered instanceof globalThis.HTMLDivElement)

          yield* $(dispatch({ event: 'click' }))

          const n = yield* $(value.get)

          ok(n === 1)
        }),
      )

      // Using on syntax
      yield* $(
        testRenderTemplate(
          html`<div onclick=${listener}></div>`,
          function* ($, rendered, dispatch) {
            const globalThis = yield* $(GlobalThis)

            ok(rendered instanceof globalThis.HTMLDivElement)

            yield* $(dispatch({ event: 'click' }))

            const n = yield* $(value.get)

            ok(n === 2)
          },
        ),
      )

      // Using eventDirective
      yield* $(
        testRenderTemplate(
          html`<div @click=${eventDirective((part) => part.update(listener))}></div>`,
          function* ($, rendered, dispatch) {
            const globalThis = yield* $(GlobalThis)

            ok(rendered instanceof globalThis.HTMLDivElement)

            yield* $(dispatch({ event: 'click' }))

            const n = yield* $(value.get)

            ok(n === 3)
          },
        ),
      )
    })

    await Effect.runPromise(Effect.scoped(test))
  })
})
