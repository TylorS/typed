import * as Runtime from '@effect/io/Runtime'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { withRefCounter } from '@typed/fx/internal/RefCounter'
import { Effect } from '@typed/fx/internal/_externals'
import type { Cause, Scope } from '@typed/fx/internal/_externals'

export interface Emitter<E, A> {
  readonly event: (a: A) => void
  readonly error: (e: Cause.Cause<E>) => void
  readonly end: () => void
}

export function fromEmitter<E, A, R = never, E2 = never>(
  emitter: (sink: Emitter<E, A>) => Effect.Effect<R | Scope.Scope, E2, unknown>,
): Fx<Exclude<R, Scope.Scope>, E | E2, A> {
  return new FromEmitterFx(emitter)
}

export class FromEmitterFx<E, A, R, E2> extends BaseFx<Exclude<R, Scope.Scope>, E | E2, A> {
  readonly name = 'FromEmitter' as const

  constructor(readonly f: (sink: Emitter<E, A>) => Effect.Effect<R | Scope.Scope, E2, unknown>) {
    super()
  }

  run(sink: Sink<E | E2, A>) {
    const { f } = this

    return withRefCounter(
      1,
      (counter) =>
        Effect.gen(function* ($) {
          const runtime = yield* $(Effect.runtime<R | Scope.Scope>())
          const fork = Runtime.runFork(runtime)
          const error = (e: Cause.Cause<E | E2>) => Effect.zipLeft(sink.error(e), counter.decrement)
          const emitter: Emitter<E, A> = {
            event: (a) => fork(sink.event(a)),
            error: (e) => fork(error(e)),
            end: () => fork(counter.decrement),
          }

          yield* $(Effect.catchAllCause(f(emitter), error))
        }),
      sink.end,
    ) as Effect.Effect<Exclude<R, Scope.Scope> | Scope.Scope, never, unknown>
  }
}
