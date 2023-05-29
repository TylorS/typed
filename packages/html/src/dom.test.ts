import { deepStrictEqual, ok } from 'assert'

import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { GlobalThis, makeDomServices } from '@typed/dom'
import { makeServerWindow } from '@typed/framework/makeServerWindow'
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
import { RenderContext } from './RenderContext.js'
import { html } from './RenderTemplate.js'
import { dom } from './dom.js'
import { Rendered } from './render.js'

const testRenderTemplate = <R, E, Y extends Effect.EffectGen<any, any, any>, O>(
  template: Fx.Fx<R, E, Rendered>,
  f: (
    $: Effect.Adapter,
    rendered: Rendered,
    sendEvent: (config: {
      event: string
      init?: EventInit
    }) => Effect.Effect<GlobalThis, never, void>,
  ) => Generator<Y, O>,
  environment: RenderContext['environment'] = 'browser',
) => {
  const window = makeServerWindow({ url: 'https://example.com' })

  return pipe(
    getFirst(template),
    Effect.flatMap((rendered) =>
      Effect.gen(($) =>
        f($, rendered, ({ event, init }) =>
          GlobalThis.withEffect((globalThis) =>
            Effect.gen(function* ($) {
              ok(rendered instanceof globalThis.HTMLElement)

              // Allow for event handlers to be registered
              yield* $(Effect.sleep(millis(1)))

              rendered.dispatchEvent(new globalThis.Event(event, init))

              // Allow for event handlers to be called
              yield* $(Effect.sleep(millis(1)))
            }),
          ),
        ),
      ),
    ),
    Effect.provideSomeLayer(dom),
    Effect.provideSomeContext(makeDomServices(window, window)),
    RenderContext.provide(RenderContext.make(environment)),
    Effect.scoped,
  )
}

const getFirst = <R, E, A>(fx: Fx.Fx<R, E, A>): Effect.Effect<R | Scope.Scope, E, A> =>
  pipe(
    fx,
    Fx.take(1),
    Fx.toReadonlyArray,
    Effect.map((x) => x[0]),
  )

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
      html`<div id=${attrDirective((part) => Effect.sync(() => part.update('foo')))}></div>`,
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
        id=${attrDirective((part) =>
          Effect.sync(() => {
            part.update('foo')
            part.update('bar')
          }),
        )}
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
      html`<div
        class=${classNameDirective((part) => Effect.sync(() => part.update('foo')))}
      ></div>`,
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
          Effect.sync(() => {
            part.add('foo', 'bar')
            part.remove('foo')
            part.toggle('baz', 'quux')
            part.toggle('quux')
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
      html`<div
        .data=${dataDirective((part) => Effect.sync(() => part.update({ test: 'foo' })))}
      ></div>`,
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
      html`<div .test=${propertyDirective((part) => Effect.sync(() => part.update('foo')))}></div>`,
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

          const element = yield* $(ref)

          ok(Option.isSome(element))
          ok(element.value === rendered)
        }),
      )

      // Using a directive
      yield* $(
        testRenderTemplate(
          html`<div
            ref=${refDirective((part) => ref.set(Option.some(part.element as HTMLDivElement)))}
          ></div>`,
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
          html`<div
            @click=${eventDirective((part) => part.update(listener) || Effect.unit())}
          ></div>`,
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

    await Effect.runPromise(test)
  })
})