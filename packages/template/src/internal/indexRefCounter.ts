import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"

export type IndexRefCounter = {
  acquire: (index: number) => Effect.Effect<never, never, void>
  release: (index: number) => Effect.Effect<never, never, void>
  wait: Effect.Effect<never, never, void>
}

/**
 * @internal
 */
export function indexRefCounter(): Effect.Effect<
  never,
  never,
  IndexRefCounter
> {
  return Effect.map(Deferred.make<never, void>(), (deferred) => {
    const indexes = new Set<number>()

    let waiting = false
    let finished = false

    function acquire(index: number) {
      return Effect.sync(() => indexes.add(index))
    }

    function release(index: number) {
      return Effect.suspend(() => {
        if (indexes.delete(index)) return checkRefCount()
        else return Effect.unit
      })
    }

    function checkRefCount() {
      if (finished) return Effect.unit
      else if (indexes.size === 0 && waiting) {
        finished = true

        return Deferred.succeed(deferred, undefined)
      } else return Effect.unit
    }

    return {
      acquire,
      release,
      wait: Effect.suspend(() => {
        waiting = true

        return Deferred.await(deferred)
      })
    }
  })
}
