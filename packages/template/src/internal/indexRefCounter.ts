import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"

export type IndexRefCounter = {
  release: (index: number) => Effect.Effect<never, never, void>
  wait: Effect.Effect<never, never, void>
}

/**
 * @internal
 */
export function indexRefCounter(expected: number, id: unknown): Effect.Effect<
  never,
  never,
  IndexRefCounter
> {
  return Effect.map(Deferred.make<never, void>(), (deferred) => {
    const indexes = new Set<number>(Array.from({ length: expected }, (_, i) => i))

    function release(index: number) {
      return Effect.suspend(() => {
        console.log("release", id, index)
        if (indexes.delete(index) && indexes.size === 0) {
          console.log("released", id, "expected", expected)

          return Deferred.succeed(deferred, undefined)
        } else {
          return Effect.unit
        }
      })
    }

    return {
      release,
      wait: Deferred.await(deferred)
    }
  })
}
