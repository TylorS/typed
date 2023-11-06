import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { RenderContext } from "@typed/template/RenderContext"
import { DomRenderEvent, type RenderEvent } from "@typed/template/RenderEvent"
import * as Effect from "effect/Effect"

export function many<R, E, A, R2, E2, B>(
  values: Fx.Fx<R, E, ReadonlyArray<A>>,
  f: (a: RefSubject.RefSubject<never, never, A>, key: B) => Fx.Fx<R2, E2, RenderEvent>,
  getKey: (a: A) => B
): Fx.Fx<R | R2 | RenderContext, E | E2, RenderEvent> {
  return Fx.scoped(
    Fx.fromFxEffect(RenderContext.with((ctx) => {
      const isServer = ctx.environment === "server" || ctx.environment === "static"

      if (isServer) {
        return Fx.switchMap(Fx.take(values, 1), (values) =>
          Fx.mergeBuffer(
            values.map((value) =>
              Fx.fromFxEffect(
                Effect.map(
                  RefSubject.make(Effect.succeed(value)),
                  (ref) => f({ ...ref, ...Fx.take(ref, 1) } as RefSubject.RefSubject<never, never, A>, getKey(value))
                )
              )
            )
          ))
      }

      return Fx.map(
        Fx.keyed(values, f, getKey),
        (events) => DomRenderEvent(events.flatMap((e) => (e as DomRenderEvent).rendered))
      )
    }))
  )
}
