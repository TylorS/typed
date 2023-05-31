import * as Effect from '@effect/io/Effect'
import * as Q from '@effect/io/Queue'

import { Fx } from './Fx.js'

export function fromDequeue<A>(queue: Q.Dequeue<A>): Fx<never, never, A> {
  return Fx((sink) =>
    Effect.catchAllCause(
      Effect.gen(function* ($) {
        let isShutdown = yield* $(queue.isShutdown())

        while (!isShutdown) {
          yield* $(queue.take(), Effect.flatMap(sink.event))
          isShutdown = yield* $(queue.isShutdown())
        }
      }),
      sink.error,
    ),
  )
}

export function fromDequeueWithShutdown<A>(queue: Q.Dequeue<A>): Fx<never, never, A> {
  return Fx((sink) =>
    Effect.onExit(
      Effect.catchAllCause(
        Effect.gen(function* ($) {
          let isShutdown = yield* $(queue.isShutdown())

          while (!isShutdown) {
            yield* $(queue.take(), Effect.flatMap(sink.event))
            isShutdown = yield* $(queue.isShutdown())
          }
        }),
        sink.error,
      ),
      queue.shutdown,
    ),
  )
}
