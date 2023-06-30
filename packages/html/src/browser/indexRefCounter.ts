import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'

/**
 * @internal
 */
export function indexRefCounter(expected: number) {
  return Effect.map(Deferred.make<never, void>(), (deferred) => {
    const hasValue = new Set<number>()

    let finished = false

    function onValue(index: number) {
      if (finished) return Effect.unit()

      hasValue.add(index)

      if (hasValue.size === expected) {
        finished = true
        hasValue.clear()

        return Deferred.succeed(deferred, undefined)
      }

      return Effect.unit()
    }

    return {
      onReady: Deferred.await(deferred),
      onValue,
    }
  })
}
