import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import * as Fx from "@typed/fx/Fx"
import type { DefaultEventMap } from "@typed/template/ElementSource"
import type { Scope } from "effect"
import * as Effect from "effect/Effect"

export function addEventListeners<T extends EventTarget, Events extends ReadonlyArray<keyof DefaultEventMap<T>>>(
  target: T,
  ...events: Events
) {
  return Fx.withEmitter<never, EventWithCurrentTarget<T, DefaultEventMap<T>[Events[number]]>, Scope.Scope>(
    (emitter) => {
      events.forEach((event) => target.addEventListener(event as string, emitter.succeed as any))

      return Effect.addFinalizer(() =>
        Effect.sync(() => {
          events.forEach((event) => target.addEventListener(event as string, emitter.succeed as any))
        })
      )
    }
  )
}
