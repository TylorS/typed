import { ok } from 'assert'

import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import { none, some } from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { GlobalThis, makeDomServices } from '@typed/dom'
import { makeServerWindow } from '@typed/framework/makeServerWindow'
import * as Fx from '@typed/fx'
import { expect } from 'vitest'

import { RenderContext } from './RenderContext.js'
import { RenderEvent } from './RenderEvent.js'
import { dom } from './dom.js'
import { Rendered } from './render.js'
import { server } from './server.js'

export const testRenderTemplate = <R, E, Y extends Effect.EffectGen<any, any, any>, O>(
  template: Fx.Fx<R, E, RenderEvent>,
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
    getRendered(template),
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

const getRendered = <R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
): Effect.Effect<R | Scope.Scope, E, Rendered> =>
  pipe(
    fx,
    Fx.filterMap((a) => (a._tag === 'RenderedDom' ? some(a.rendered) : none())),
    Fx.take(1),
    Fx.toReadonlyArray,
    Effect.map((x) => x[0]),
  )

export const testRenderEvents = <R, E>(
  template: Fx.Fx<R, E, RenderEvent>,
  expected: readonly RenderEvent[],
  environment: RenderContext['environment'] = 'test',
) => {
  const window = makeServerWindow({ url: 'https://example.com' })

  return pipe(
    template,
    Fx.toReadonlyArray,
    Effect.flatMap((events) =>
      Effect.sync(() => {
        try {
          return expect(events.map(trimRenderEvent)).toEqual(expected.map(trimRenderEvent))
        } catch (error) {
          console.log('Actual', events.map(trimRenderEvent))
          console.log('Expected', expected.map(trimRenderEvent))

          throw error
        }
      }),
    ),
    Effect.provideSomeLayer(server),
    Effect.provideSomeContext(makeDomServices(window, window)),
    RenderContext.provide(RenderContext.make(environment)),
    Effect.scoped,
  )
}

function trimRenderEvent(event: RenderEvent) {
  switch (event._tag) {
    case 'FullHtml':
      return { ...event, html: trimExtraSpaces(event.html) }
    case 'PartialHtml':
      return { ...event, html: trimExtraSpaces(event.html) }
    default:
      return event
  }
}

function trimExtraSpaces(s: string) {
  return s
    .replace(/\n/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>(\s+)/g, '>')
    .replace(/(\s+)</g, '<')
    .replace(/(\s+)>/g, '>')
}
