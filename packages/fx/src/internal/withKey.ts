import type { Fx, FxInput } from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import { makeSubject } from "@typed/fx/internal/core-subject"
import { fromFxEffect } from "@typed/fx/internal/fx"
import { run } from "@typed/fx/internal/run"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Sink from "@typed/fx/Sink"
import type { Subject } from "@typed/fx/Subject"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import * as Fiber from "effect/Fiber"
import * as Option from "effect/Option"
import * as Scope from "effect/Scope"

export interface WithKeyOptions<A, B> {
  readonly key: (a: A) => B
  readonly eq?: Equivalence<B>
}

export function withKey<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  onValue: (ref: RefSubject.RefSubject<never, never, A>, key: C) => FxInput<R2, E2, B>,
  options: WithKeyOptions<A, C>
): Fx<R | R2, E | E2, B> {
  return core.withScopedFork(({ fork, scope, sink }) =>
    Effect.gen(function*(_) {
      let current: Option.Option<
        [C, Subject<never, never, A>, RefSubject.RefSubject<never, never, A>, Fiber.Fiber<never, unknown>]
      > = Option.none()
      const eq = options.eq || equals

      const make = (a: A) =>
        Effect.gen(function*(_) {
          // Use an intermediate subject to ensure outer values
          // are utilized as the "current" value when calling .delete
          // on our RefSubject
          const subject = makeSubject<never, A>()
          const key = options.key(a)
          const ref = yield* _(RefSubject.make(subject), Effect.provideService(Scope.Scope, scope))
          const fiber = yield* _(
            run(fromFxEffect(Effect.map(subject.onSuccess(a), () => core.from(onValue(ref, key)))), sink),
            fork
          )

          // Save our state
          current = Option.some([key, subject, ref, fiber])

          // Allow our Fibers to start
          yield* _(Effect.sleep(0))
        })

      yield* _(run(
        fx,
        Sink.WithContext(
          sink.onFailure,
          (a) =>
            Effect.gen(function*(_) {
              if (Option.isNone(current)) {
                yield _(make(a))
              } else {
                const [key, subject, ref, fiber] = current.value

                if (eq(key, options.key(a))) {
                  // Key didn't change, so we just emit an updated value.
                  yield* _(subject.onSuccess(a))
                } else {
                  // Cleanup previous resources
                  yield* _(fork(Effect.all([subject.interrupt, ref.interrupt, Fiber.interrupt(fiber)])))

                  // Create a new RefSubject
                  yield* _(make(a))
                }
              }
            })
        )
      ))

      if (Option.isSome(current)) {
        const [, subject, ref, fiber] = current.value

        // Signal there will be no more input events
        yield* _(fork(Effect.all([subject.interrupt, ref.interrupt])))

        // Wait for the last Fiber to complete
        yield* _(Effect.fromFiber(fiber))
      }
    })
  )
}
