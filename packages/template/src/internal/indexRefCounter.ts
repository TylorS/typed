import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

export type IndexRefCounter = {
  release: (index: number) => Effect.Effect<void>
  expect: (count: number) => Effect.Effect<boolean>
  wait: Effect.Effect<void>
}

/**
 * @internal
 */
export const makeRefCounter: Effect.Effect<IndexRefCounter> = Effect.map(Deferred.make<void>(), (deferred) => {
  let expected: Option.Option<number> = Option.none<number>()
  const done = Deferred.succeed(deferred, undefined)
  const indexes = new Set<number>()

  function isDone() {
    if (Option.isSome(expected)) {
      return indexes.size === expected.value
    } else {
      return false
    }
  }

  function release(index: number) {
    return Effect.suspend(() => {
      indexes.add(index)
      if (isDone()) {
        return done
      } else {
        return Effect.succeed(false)
      }
    })
  }

  function expect(count: number) {
    return Effect.suspend(() => {
      expected = Option.some(count)
      if (isDone()) {
        return Effect.as(done, false)
      } else {
        return Effect.succeed(true)
      }
    })
  }

  return {
    release,
    expect,
    wait: Deferred.await(deferred)
  }
})
