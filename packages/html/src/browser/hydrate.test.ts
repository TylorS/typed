import { deepStrictEqual, ok } from 'assert'

import * as Duration from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { GlobalThis, makeDomServices } from '@typed/dom'
import * as Fx from '@typed/fx'
import { describe, it } from 'vitest'

import { EventHandler } from '../EventHandler.js'
import { RenderContext, makeRenderContext } from '../RenderContext.js'
import { html } from '../RenderTemplate.js'
import { Rendered } from '../Rendered.js'
import { TemplateResult } from '../TemplateResult.js'
import { TYPED_ATTR, TYPED_HOLE } from '../meta.js'
import { makeServerWindow } from '../server/makeServerWindow.js'
import { renderToHtml } from '../server/renderToHtml.js'

import { hydrate } from './hydrate.js'

describe(hydrate.name, () => {
  it('renders a simple elements', async () => {
    const test = testHydrate(
      html`<div></div>`,
      (body) => ({ div: body.querySelector('div') }),
      ({ div }, rendered) => Effect.sync(() => ok(rendered === div)),
    )

    await Effect.runPromise(test)
  })

  it('renders a simple elements with attributes', async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const getInitial = (body: HTMLElement) => ({ div: body.querySelector('div')! })

    const onRendered =
      (withAttr: boolean) =>
      ({ div }: { div: HTMLElement }, rendered: Rendered | null) =>
        Effect.sync(() => {
          ok(rendered === div)

          deepStrictEqual(
            stripDataTyped((rendered as HTMLElement).outerHTML),
            `<div data-typed="..." id="test">${withAttr ? TYPED_ATTR(0) : ''}</div>`,
          )
        })

    const staticAttr = testHydrate(html`<div id="test"></div>`, getInitial, onRendered(false))

    const staticPart = testHydrate(html`<div id=${'test'}></div>`, getInitial, onRendered(true))

    const effectPart = testHydrate(
      html`<div id=${Effect.succeed('test')}></div>`,
      getInitial,
      onRendered(true),
    )

    const fxPart = testHydrate(
      html`<div id=${Fx.at('test', Duration.millis(10))}></div>`,
      getInitial,
      onRendered(true),
    )

    await Promise.all([staticAttr, staticPart, effectPart, fxPart].map(Effect.runPromise))
  })

  it('renders interpolated templates', async () => {
    const test = testHydrate(
      html`<div>${html`<span></span>`}</div>`,
      (body) => {
        const div = body.querySelector('div')

        return { div }
      },
      ({ div }, rendered) =>
        Effect.gen(function* ($) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered instanceof globalThis.HTMLDivElement)
          ok(rendered === div)
          deepStrictEqual(
            stripDataTyped(rendered.outerHTML),
            `<div data-typed="..."><span data-typed="..."></span>${TYPED_HOLE(0)}</div>`,
          )
        }),
    )

    await Effect.runPromise(test)
  })

  it('renders interpolated sibling templates', async () => {
    const spanTemplate = html`<span></span>`

    const test = testHydrate(
      html`<div>${spanTemplate}${spanTemplate}${spanTemplate}</div>`,
      (body) => ({ div: body.querySelector('div') }),
      ({ div }, rendered) =>
        Effect.gen(function* ($) {
          const globalThis = yield* $(GlobalThis)

          ok(rendered instanceof globalThis.HTMLDivElement)
          ok(rendered === div)
          deepStrictEqual(
            stripDataTyped(rendered.outerHTML),
            `<div data-typed="..."><span data-typed="..."></span>${TYPED_HOLE(
              0,
            )}<span data-typed="..."></span>${TYPED_HOLE(
              1,
            )}<span data-typed="..."></span>${TYPED_HOLE(2)}</div>`,
          )
        }),
    )

    await Effect.runPromise(test)
  })

  it('reattaches event listeners', async () => {
    const test = Effect.gen(function* ($) {
      const count = yield* $(Fx.makeRef(Effect.succeed(0)))

      yield* $(
        testHydrate(
          html`<div @click=${EventHandler(() => count.update((x) => x + 1))}></div>`,
          (body) => ({ div: body.querySelector('div') }),
          ({ div }, rendered, dispatchEvent) =>
            Effect.gen(function* ($) {
              const globalThis = yield* $(GlobalThis)

              ok(rendered instanceof globalThis.HTMLDivElement)
              ok(rendered === div)
              deepStrictEqual(
                stripDataTyped(rendered.outerHTML),
                `<div data-typed="...">${TYPED_ATTR(0)}</div>`,
              )

              yield* $(dispatchEvent({ element: rendered, eventName: 'click' }))

              deepStrictEqual(yield* $(count), 1)
            }),
        ),
      )
    })

    await Effect.runPromise(Effect.scoped(test))
  })
})

type DispatchEventParams = {
  element?: HTMLElement
  eventName: string
  init?: EventInit
}

type DispatchEvent = (params: DispatchEventParams) => Effect.Effect<never, never, void>

function testHydrate<R, E, A, R2, E2>(
  what: Fx.Fx<R, E, TemplateResult>,
  getInitial: (body: HTMLElement) => A,
  onRendered: (
    initial: A,
    rendered: Rendered | null,
    dispatch: DispatchEvent,
  ) => Effect.Effect<R2, E2, unknown>,
  take = 1,
) {
  const window = makeServerWindow()
  const where = window.document.body

  return pipe(
    Effect.gen(function* ($) {
      const html = yield* $(renderToHtml(what), RenderContext.provide(makeRenderContext('server')))

      where.innerHTML = html

      const initial = getInitial(where)

      function dispatchEvent(params: DispatchEventParams) {
        return Effect.gen(function* ($) {
          // Ensure event handlers are attached
          yield* $(Effect.sleep(Duration.millis(1)))

          const element = params.element || where

          const event = new window.Event(params.eventName, params.init)

          element.dispatchEvent(event)

          // Allow event handlers to run
          yield* $(Effect.sleep(Duration.millis(1)))
        })
      }

      return yield* $(
        hydrate(what, where),
        Fx.take(take),
        Fx.observe((rendered) => onRendered(initial, rendered, dispatchEvent)),
        RenderContext.provide(makeRenderContext('browser')),
      )
    }),
    Effect.provideSomeContext(makeDomServices(window, window)),
    Effect.scoped,
  )
}

function stripDataTyped(s: string): string {
  return s.replace(/data-typed="[^"]+"/g, 'data-typed="..."')
}
