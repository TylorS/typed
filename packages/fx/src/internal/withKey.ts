import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Option from "effect/Option"
import type * as Scope from "effect/Scope"

import type { Fx, WithKeyOptions } from "../Fx.js"
import * as RefSubject from "../RefSubject.js"
import * as Sink from "../Sink.js"
import { withSwitchFork } from "./helpers.js"
import { FxBase } from "./protos.js"

export function withKey<R, E, A, B extends PropertyKey, R2, E2, C>(
  fx: Fx<R, E, A>,
  options: WithKeyOptions<A, B, R2, E2, C>
): Fx<R | R2 | Scope.Scope, E | E2, C> {
  return new WithKey(fx, options)
}

class WithKey<R, E, A, B extends PropertyKey, R2, E2, C> extends FxBase<R | R2 | Scope.Scope, E | E2, C> {
  constructor(readonly fx: Fx<R, E, A>, readonly options: WithKeyOptions<A, B, R2, E2, C>) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, C>) {
    return runWithKey(this.fx, this.options, sink)
  }
}

function runWithKey<R, E, A, B extends PropertyKey, R2, E2, C, R3>(
  fx: Fx<R, E, A>,
  options: WithKeyOptions<A, B, R2, E2, C>,
  sink: Sink.Sink<R3, E | E2, C>
) {
  return withSwitchFork((fork) => {
    let previous: Option.Option<WithKeyState<A, B>> = Option.none()

    const run = fx.run(Sink.make(
      (cause) => sink.onFailure(cause),
      (value) =>
        Effect.gen(function*(_) {
          const key = options.getKey(value)

          // We don't need to do anything if the key is the same as the previous one
          if (Option.isSome(previous)) {
            const prev = previous.value

            // If the key is the same, we just need to update the value
            if (prev.key === key) {
              prev.value = value
              yield* _(RefSubject.set(prev.ref, value))
              return
            } else {
              // Otherwise, we need to remove the previous value
              yield* _(prev.ref.interrupt)
            }
          }

          const ref = yield* _(RefSubject.fromEffect(Effect.sync(() => state.value)))

          // Create a new state
          const state: WithKeyState<A, B> = {
            value,
            key,
            ref
          }

          previous = Option.some(state)

          // Create a new listener
          yield* _(fork(options.onValue(state.ref, state.key).run(sink)))
        })
    ))

    return Effect.flatMap(run, () => Option.isSome(previous) ? previous.value.ref.interrupt : Effect.unit)
  }, ExecutionStrategy.sequential)
}

type WithKeyState<A, B> = {
  value: A
  key: B
  ref: RefSubject.RefSubject<never, never, A>
}
