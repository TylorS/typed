import { pipe } from '@fp-ts/data/Function'

import * as Effect from '../Effect.js'
import { pending } from '../Future.js'
import { flow2 } from '../_internal/flow2.js'

import { Sink, Stream } from './Stream.js'

export function runObserve<A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) {
  return <R, E>(stream: Stream<R, E, A>): Effect.Effect<R | R2, E | E2, void> => {
    return Effect.scoped(
      Effect.lazy(() => {
        const future = pending.io<E | E2, void>()

        return pipe(
          Effect.forkScoped(
            stream.run(
              Sink(
                (a) => f(a).flatMapCause((cause) => future.complete(Effect.fromCause(cause))),
                flow2(Effect.fromCause, future.complete),
                future.complete(Effect.unit),
              ),
            ),
          ),
          Effect.flatMap(() => Effect.wait(future)),
        )
      }),
    )
  }
}
