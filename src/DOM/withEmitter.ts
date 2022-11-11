import * as Deferred from '@effect/core/io/Deferred'
import * as Effect from '@effect/core/io/Effect'
import * as Exit from '@effect/core/io/Exit'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Emitter, Fx, UnsafeEmitter } from '@typed/fx'

export function withEmitter<R, E, A>(
  f: (emitter: UnsafeEmitter<E, A>) => Effect.Canceler<R>,
): Fx<R, E, A> {
  return Fx<R, E, A>(<R2>(sink: Emitter<R2, E, A>) =>
    Effect.gen(function* ($) {
      const runtime = yield* $(Effect.runtime<R | R2>())
      const deferred = yield* $(Deferred.make<never, unknown>())

      let canceler: Effect.Canceler<R> = Effect.unit

      yield* $(Effect.addFinalizer(Effect.suspendSucceed(() => canceler)))

      canceler = f({
        unsafeEmit: (a) =>
          runtime.unsafeRunAsyncWith(sink.emit(a), (exit) =>
            Exit.isFailure(exit) ? deferred.unsafeDone(Effect.failCause(exit.cause)) : undefined,
          ),
        unsafeFailCause: (e) =>
          runtime.unsafeRunAsyncWith(sink.failCause(e), (exit) =>
            pipe(exit, Effect.done, deferred.unsafeDone),
          ),
        unsafeEnd: () =>
          runtime.unsafeRunAsyncWith(sink.end, (exit) =>
            pipe(exit, Effect.done, deferred.unsafeDone),
          ),
      })

      return yield* $(Effect.onInterrupt(() => canceler)(deferred.await))
    }),
  )
}
