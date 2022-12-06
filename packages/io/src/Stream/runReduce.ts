import { pipe } from '@fp-ts/data/Function'

import * as Effect from '../Effect.js'

import { Stream } from './Stream.js'
import { runObserve } from './runObserve.js'

export function runReduce<B, A>(seed: B, f: (b: B, a: A) => B) {
  return <R, E>(stream: Stream<R, E, A>): Effect.Effect<R, E, B> =>
    Effect.lazy(() => {
      let acc: B = seed

      return pipe(
        stream,
        runObserve((a) => Effect.sync(() => (acc = f(acc, a)))),
        Effect.map(() => acc),
      )
    })
}
