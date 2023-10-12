import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"

export type IndexRefCounter = {
  onReady: Effect.Effect<never, never, void>
  onValue: (index: number) => Effect.Effect<never, never, void>
}

/**
 * @internal
 */
export function indexRefCounter(
  expected: number
): Effect.Effect<
  never,
  never,
  IndexRefCounter
> {
  return Effect.map(Deferred.make<never, void>(), (deferred) => {
    const hasValue = new Set<number>()

    let finished = false

    function onValue(index: number) {
      if (finished) return Effect.unit

      hasValue.add(index)

      if (hasValue.size === expected) {
        finished = true
        hasValue.clear()

        return Deferred.succeed(deferred, undefined)
      }

      return Effect.unit
    }

    return {
      onReady: Deferred.await(deferred),
      onValue
    }
  })
}
