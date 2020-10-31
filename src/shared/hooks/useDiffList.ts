import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { Eq, eqStrict } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'
import { findFirst } from 'fp-ts/ReadonlyArray'

import { SharedEnv } from '../SharedEnv'
import { useMemo } from './useMemo'
import { useRef } from './useRef'

const pureTrue = Pure.of(true)

export type ListDiff<A> = {
  readonly list: ReadonlyArray<A>
  readonly added: ReadonlyArray<readonly [value: A, index: number]>
  readonly removed: ReadonlyArray<readonly [value: A, index: number]>
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
    const diff = yield* useMemo(() => createDiff(eq), [eq], [eqStrict])

    if (firstRun.current) {
      firstRun.current = false

      return { list, added: list.map((x, i) => [x, i] as const), removed: [] } as ListDiff<A>
    }

    const listDiff = diff(previous.current, list)

    if (listDiff.added.length > 0 || listDiff.removed.length > 0) {
      previous.current = list
    }

    return listDiff
  })

  return eff
}

const createDiff = <A>(eq: Eq<A>) => {
  return (current: ReadonlyArray<A>, updated: ReadonlyArray<A>): ListDiff<A> => {
    const added = new Set<readonly [A, number]>()
    const removed = new Set<readonly [A, number]>()

    for (let i = 0; i < current.length; ++i) {
      const value = current[i]
      const option = pipe(
        updated,
        findFirst((a) => eq.equals(a, value)),
      )

      if (isNone(option)) {
        removed.add([value, i])
      }
    }

    for (let i = 0; i < updated.length; ++i) {
      const value = updated[i]
      const option = pipe(
        current,
        findFirst((a) => eq.equals(a, value)),
      )

      if (isNone(option)) {
        added.add([value, i])
      }
    }

    return {
      list: updated,
      added: Array.from(added),
      removed: Array.from(removed),
    } as const
  }
}
