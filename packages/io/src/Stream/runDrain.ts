import * as Effect from '../Effect.js'
import { pending } from '../Future.js'
import { forkScoped } from '../Scope.js'
import { flow2 } from '../_internal.js'

import { Sink, Stream } from './Stream.js'

export function runDrain<R, E, A>(stream: Stream<R, E, A>): Effect.Effect<R, E, void> {
  return Effect.scoped(
    Effect.gen(function* () {
      const future = pending.io<E, void>()

      yield* forkScoped(
        stream.run(
          Sink(
            () => Effect.unit,
            flow2(Effect.fromCause, future.complete),
            future.complete(Effect.unit),
          ),
        ),
      )

      return yield* Effect.wait(future)
    }),
  )
}
