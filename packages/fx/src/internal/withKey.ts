import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import * as Fiber from "effect/Fiber"
import * as Option from "effect/Option"
import * as Scope from "effect/Scope"
import type { Fx, FxInput } from "../Fx"
import * as RefSubject from "../RefSubject"
import * as Sink from "../Sink"
import * as core from "./core.js"
import { adjustTime } from "./helpers.js"
import { run } from "./run.js"

export function withKey<R, E, A, B, R2, E2, C>(
  fx: Fx<R, E, A>,
  getKey: (a: A) => B,
  onValue: (ref: RefSubject.RefSubject<never, never, A>, key: B) => FxInput<R2, E2, C>
): Fx<R | R2, E | E2, C> {
  return core.withScopedFork(({ fork, scope, sink }) =>
    Effect.gen(function*(_) {
      let current: Option.Option<
        [B, { value: A }, RefSubject.RefSubject<never, never, A>, Fiber.Fiber<never, unknown>]
      > = Option.none()

      const lock = (yield* _(Effect.makeSemaphore(1))).withPermits(1)

      const make = (a: A) =>
        Effect.uninterruptibleMask((restore) =>
          Effect.gen(function*(_) {
            const key = getKey(a)
            // We use a simple mutable object to track the current value
            // of the state coming from the "outside", such that any internal
            // usage of RefSubject.delete will reset to the latest value emitted
            // from here.
            const currentValue = { value: a }
            const ref = yield* _(
              RefSubject.fromEffect(Effect.sync(() => currentValue.value)),
              Effect.provideService(Scope.Scope, scope)
            )
            const fiber = yield* _(
              run(core.from(onValue(ref, key)), sink),
              restore,
              fork
            )

            // Save our state
            current = Option.some([key, currentValue, ref, fiber])

            // Allow our Fibers to start
            yield* _(adjustTime(1))
          })
        )

      yield* _(run(
        fx,
        Sink.WithContext(
          sink.onFailure,
          (a) =>
            lock(Effect.gen(function*(_) {
              if (Option.isNone(current)) {
                yield _(make(a))
              } else {
                const [key, currentValue, ref, fiber] = current.value

                if (equals(key, getKey(a))) {
                  // Key didn't change, so we just set an updated value.

                  currentValue.value = a
                  yield* _(ref.set(a))
                } else {
                  // Cleanup previous resources
                  yield* _(Fiber.interrupt(fiber))

                  // Create a new RefSubject
                  yield* _(make(a))
                }
              }
            }))
        )
      ))

      if (Option.isSome(current)) {
        const [, , ref, fiber] = current.value

        // Signal there will be no more input events
        yield* _(fork(ref.interrupt))

        // Wait for the last Fiber to complete
        yield* _(Effect.fromFiber(fiber))
      }
    })
  )
}
