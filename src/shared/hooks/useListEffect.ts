import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect, map, zip } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { SharedEnv } from '../SharedEnv'
import { useDiffList } from './useDiffList'
import { useMemo } from './useMemo'
import { useRef } from './useRef'

/**
 * Reform an effect over a list of values only as the values change.
 */
export function useListEffect<A, E, B>(
  list: ReadonlyArray<A>,
  f: (value: A, index: number) => Effect<E, B>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E & SharedEnv, ReadonlyArray<B>> {
  const eff = doEffect(function* () {
    const { added, removed } = yield* useDiffList(list, eq)
    const memoized = yield* useMemo(() => new Map<number, B>(), [])
    const ref = yield* useRef<unknown, ReadonlyArray<B>>(Pure.of([]))
    const addedValues = added.length > 0
    const removedValues = removed.length > 0

    if (removedValues) {
      removed.forEach(([, i]) => memoized.delete(i))
    }

    if (addedValues) {
      yield* zip(added.map(([value, index]) => map((b) => memoized.set(index, b), f(value, index))))
    }

    if (addedValues || removedValues) {
      ref.current = Array.from(memoized.values())
    }

    return ref.current
  })

  return eff
}
