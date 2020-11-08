import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { SharedEnv } from '@typed/fp/shared/core/exports'
import { Eq, eqStrict } from 'fp-ts/Eq'
import { difference, intersection } from 'fp-ts/ReadonlyArray'

import { useMemo } from './useMemo'
import { useRef } from './useRef'

const pureTrue = Pure.of(true)

export type ListDiff<A> = {
  readonly unchanged: ReadonlyArray<A>
  readonly added: ReadonlyArray<A>
  readonly removed: ReadonlyArray<A>
}

/**
 * Diff a list into added and removed values
 */
export const useDiffList = <A>(
  list: ReadonlyArray<A>,
  eq: Eq<A>,
): Effect<SharedEnv, ListDiff<A>> => {
  const eff = doEffect(function* () {
    const firstRun = yield* useRef(pureTrue)
    const previous = yield* useRef(Pure.of(list))
    const [diff, intersect] = yield* useMemo(
      () => [difference(eq), intersection(eq)],
      [eq],
      [eqStrict],
    )

    if (firstRun.current) {
      firstRun.current = false

      return { unchanged: [], added: list, removed: [] } as ListDiff<A>
    }

    const unchanged = intersect(previous.current, list)
    const removed = diff(previous.current, list)
    const added = diff(list, previous.current)

    if (added.length > 0 || removed.length > 0) {
      previous.current = list
    }

    const listDiff: ListDiff<A> = {
      unchanged,
      added,
      removed,
    }

    return listDiff
  })

  return eff
}
