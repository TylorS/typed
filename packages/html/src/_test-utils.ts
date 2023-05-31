import { ok } from 'assert'

import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { GlobalThis, makeDomServices } from '@typed/dom'
import { makeServerWindow } from '@typed/framework/makeServerWindow'
import * as Fx from '@typed/fx'

import { RenderContext } from './RenderContext.js'
import { dom } from './dom.js'
import { Rendered } from './render.js'

export const testRenderTemplate = <
  R,
  E,
  T extends Rendered,
  Y extends Effect.EffectGen<any, any, any>,
  O,
>(
  template: Fx.Fx<R, E, T>,
  f: (
    $: Effect.Adapter,
    rendered: T,
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
