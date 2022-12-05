import { pipe } from '@fp-ts/data/Function'

import * as Effect from '../Effect.js'
import { pending } from '../Future.js'
import { forkScoped } from '../Scope.js'

import { Sink, Stream } from './Stream.js'

export function runObserve<A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) {
  return <R, E>(stream: Stream<R, E, A>): Effect.Effect<R | R2, E | E2, void> =>
    Effect.scoped(
      Effect.gen(function* () {
        const future = pending.io<E | E2, void>()
        const scheduler = yield* Effect.getScheduler

        yield* forkScoped(
          stream.run(
            Sink(
              (_, a) =>
                pipe(
                  f(a),
                  Effect.flatMapCause((cause) => future.complete(Effect.fromCause(cause))),
                ),
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
