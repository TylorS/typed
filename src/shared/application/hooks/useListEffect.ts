import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, Pure } from '@typed/fp/Effect/Effect'
import { doEffect, map, zip } from '@typed/fp/Effect/exports'
import { SharedEnv } from '@typed/fp/Shared/domain/exports'
import { Eq } from 'fp-ts/Eq'

import { useDiffList } from './useDiffList'
import { useMemo } from './useMemo'
import { useRef } from './useRef'

export type ListEffectOptions<A> = {
  readonly eq?: Eq<A>
  readonly onDelete?: (value: A, index: number) => void
}

/**
 * Reform an effect over a list of values only as the values change.
 */
export function useListEffect<A, E, B>(
  list: ReadonlyArray<A>,
  f: (value: A, index: number) => Effect<E, B>,
  options: ListEffectOptions<A> = {},
): Effect<E & SharedEnv, ReadonlyArray<B>> {
  const { eq = deepEqualsEq, onDelete } = options

  const eff = doEffect(function* () {
    const { added, removed } = yield* useDiffList(list, eq)
    const memoized = yield* useMemo(() => new Map<number, B>(), [])
    const ref = yield* useRef<unknown, ReadonlyArray<B>>(Pure.of([]))
    const addedValues = added.length > 0
    const removedValues = removed.length > 0

    if (removedValues) {
      removed.forEach(([value, i]) => {
        memoized.delete(i)
        onDelete?.(value, i)
      })
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
