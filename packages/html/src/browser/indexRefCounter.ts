import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'

export function indexRefCounter(expected: number) {
  return Effect.map(Deferred.make<never, void>(), (deferred) => {
    const hasValue = new Set<number>()
    const done = Deferred.succeed(deferred, undefined)

    let finished = false

    function onValue(index: number) {
      return Effect.suspend(() => {
        if (finished) return Effect.unit()

        hasValue.add(index)

        if (hasValue.size === expected) {
          finished = true
          hasValue.clear()

          return done
        }

        return Effect.unit()
      })
    }

    return {
      onReady: Deferred.await(deferred),
      onValue,
    }
  })
}
