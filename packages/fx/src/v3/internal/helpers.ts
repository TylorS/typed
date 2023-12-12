import { Effect, Scope } from "effect"
import type * as Sink from "../Sink.js"

export function withBuffers<R, E, A>(size: number, sink: Sink.Sink<R, E, A>) {
  const buffers: Array<Array<A>> = Array.from({ length: size }, () => [])
  const finished = new Set<number>()
  let currentIndex = 0

  const drainBuffer = (index: number): Effect.Effect<R, never, void> => {
    const effect = Effect.forEach(buffers[index], sink.onSuccess)
    buffers[index] = []

    return Effect.flatMap(effect, () => finished.has(index) ? onEnd(index) : Effect.unit)
  }

  const onSuccess = (index: number, value: A) => {
    if (index === currentIndex) {
      const buffer = buffers[index]

      if (buffer.length === 0) {
        return sink.onSuccess(value)
      } else {
        buffer.push(value)

        return drainBuffer(index)
      }
    } else {
      buffers[index].push(value)

      return Effect.unit
    }
  }

  const onEnd = (index: number) => {
    finished.add(index)

    if (index === currentIndex && ++currentIndex < size) {
      return drainBuffer(currentIndex)
    } else {
      return Effect.unit
    }
  }

  return {
    onSuccess,
    onEnd
  } as const
}

export const withScope = <R, E, A>(f: (scope: Scope.Scope) => Effect.Effect<R, E, A>): Effect.Effect<R, E, A> =>
  Effect.acquireUseRelease(Scope.make(), f, Scope.close)
