import { Arity1, deepEqualsEq } from '@typed/fp/common/exports'
import { Effect } from '@typed/fp/Effect/Effect'
import { doEffect, zip } from '@typed/fp/Effect/exports'
import { memoize } from '@typed/fp/lambda/exports'
import { SchedulerEnv } from '@typed/fp/Scheduler/exports'
import {
  getSendSharedEvent,
  Namespace,
  runWithNamespace,
  SharedEnv,
} from '@typed/fp/Shared/core/exports'
import { Eq, getTupleEq } from 'fp-ts/Eq'

import { useDiffList } from './useDiffList'
import { useDisposable } from './useDisposable'
import { useMemo } from './useMemo'

export type ListEffectOptions<A> = {
  readonly onDelete?: (value: A, index: number) => void
}

/**
 * Reform an effect over a list of values only as the values change.
 */
export function useListEffect<A, E extends SharedEnv, B>(
  list: ReadonlyArray<A>,
  toNamespace: Arity1<A, Namespace>, // Will be memoized
  f: (value: A, index: number) => Effect<E, B>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E & SchedulerEnv, ReadonlyArray<B>> {
  const eff = doEffect(function* () {
    const sendSharedEvent = yield* getSendSharedEvent
    const getNamespace = yield* useMemo(() => memoize(getTupleEq(eq))(toNamespace), [])

    // Ensure memoization is released with Namespace
    yield* useDisposable(() => getNamespace, [])

    const { added, removed } = yield* useDiffList(list, eq)

    if (added.length > 0) {
      added.forEach((value) =>
        sendSharedEvent({ type: 'namespace/created', namespace: getNamespace(value) }),
      )
    }

    if (removed.length > 0) {
      removed.forEach((value) =>
        sendSharedEvent({ type: 'namespace/deleted', namespace: getNamespace(value) }),
      )
    }

    return yield* zip(list.map((value, i) => runWithNamespace(getNamespace(value), f(value, i))))
  })

  return eff
}
