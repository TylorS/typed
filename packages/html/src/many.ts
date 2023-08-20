import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

import { RenderContext } from './RenderContext.js'
import { DomRenderEvent, RenderEvent } from './RenderEvent.js'

export function many<R, E, A, R2, E2, B>(
  values: Fx.Fx<R, E, ReadonlyArray<A>>,
  f: (a: Fx.RefSubject<never, A>, key: B) => Fx.Fx<R2, E2, RenderEvent>,
  getKey: (a: A) => B,
): Fx.Fx<R | R2 | RenderContext, E | E2, RenderEvent> {
  return Fx.scoped(
    RenderContext.withFx((ctx) => {
      const isServer = ctx.environment === 'server' || ctx.environment === 'static'

      if (isServer) {
        return Fx.switchMap(Fx.take(values, 1), (values) =>
          Fx.mergeBufferConcurrently(
            ...values.map((value) =>
              Fx.fromFxEffect(
                Effect.map(Fx.makeRef(Effect.succeed(value)), (ref) =>
                  f({ ...ref, ...Fx.take(ref, 1) } as Fx.RefSubject<never, A>, getKey(value)),
                ),
              ),
            ),
          ),
        )
      }

      return Fx.map(Fx.keyed(values, f, getKey), (events) =>
        DomRenderEvent(events.flatMap((e) => (e as DomRenderEvent).rendered)),
      )
    }),
  )
}
