import * as Chunk from '@effect/data/Chunk'
import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { empty } from './empty.js'

/**
 * Merges n Fx concurrently, emitting the values in order of the streams are provided.
 * For example, Fx at index 0 will emit all of its values first, when it completes, Fx at index 1 will emit all of its values, and so on.
 * When there is asynchrony, the indexes which are not yet ready are buffered.
 */
export function mergeBufferConcurrently<FXS extends Fx.TupleAny>(
  ...fxs: FXS
): Fx<Fx.Context<FXS[number]>, Fx.Error<FXS[number]>, Fx.Success<FXS[number]>> {
  if (fxs.length === 0) return empty()
  if (fxs.length === 1) return fxs[0]

  return Fx(<R2>(sink: Sink<R2, Fx.Error<FXS[number]>, Fx.Success<FXS[number]>>) =>
    Effect.suspend(() => {
      type O = Fx.Success<FXS[number]>

      const finished = new Map<number, Chunk.Chunk<O>>()
      let currentIndex = 0

      function onFinished(index: number, buffer: Chunk.Chunk<O>): Effect.Effect<R2, never, void> {
        if (currentIndex < index) {
          // If the current index is behind, buffer the value
          return Effect.sync(() => {
            finished.set(index, buffer)
          })
        }

        if (Chunk.size(buffer) === 0) {
          return next(index)
        }

        return Effect.flatMap(Effect.all(Chunk.map(buffer, sink.event)), () => next(index))
      }

      function next(index: number): Effect.Effect<R2, never, void> {
        return Effect.suspend(() => {
          finished.delete(index)

          const nextIndex = ++currentIndex

          if (finished.has(nextIndex)) {
            return onFinished(nextIndex, finished.get(nextIndex) as Chunk.Chunk<O>)
          }

          return Effect.unit
        })
      }

      return Effect.all(
        fxs.map((fx, index) =>
          Effect.suspend(() => {
            if (index === currentIndex) return Effect.flatMap(fx.run(sink), () => next(index))

            let buffer: Chunk.Chunk<O> = Chunk.empty()
            let isEmitting = false

            return Effect.flatMap(
              fx.run(
                Sink(
                  (o) =>
                    Effect.suspend(
                      Effect.unifiedFn(() => {
                        // The current index is emitting now
                        if (isEmitting) {
                          return sink.event(o)
                        }

                        // This index is ready to emit values
                        if (index === currentIndex) {
                          // Fast-path for remaining values
                          isEmitting = true

                          if (Chunk.size(buffer) === 0) return sink.event(o)

                          // Drain the current buffer first
                          const toEmit = Chunk.append(buffer, o)
                          // Clear the buffer
                          buffer = Chunk.empty()

                          // Emit the values
                          return Effect.forEach(toEmit, sink.event, { discard: true })
                        }

                        // Otherwise, buffer the value
                        buffer = Chunk.append(buffer, o)

                        return Effect.unit
                      }),
                    ),
                  sink.error,
                ),
              ),
              () => (isEmitting ? next(index) : onFinished(index, buffer)),
            )
          }),
        ),
        { concurrency: 'unbounded', discard: true },
      )
    }),
  )
}
