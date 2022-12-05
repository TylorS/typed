import * as Effect from '../Effect.js'
import { pending } from '../Future.js'
import { forkScoped } from '../Scope.js'

import { Sink, Stream } from './Stream.js'

export function runDrain<R, E, A>(stream: Stream<R, E, A>): Effect.Effect<R, E, void> {
  return Effect.scoped(
    Effect.gen(function* () {
      const future = pending.io<E, void>()
      const scheduler = yield* Effect.getScheduler

      yield* forkScoped(
        stream.run(
          Sink(
            () => Effect.unit,
            (_, e) => future.complete(Effect.fromCause(e)),
            () => future.complete(Effect.unit),
          ),
          scheduler,
        ),
      )

      return yield* Effect.wait(future)
    }),
  )
}
