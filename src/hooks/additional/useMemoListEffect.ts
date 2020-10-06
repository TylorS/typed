import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect, EnvOf, lazy, Pure, zip } from '@typed/fp/Effect/exports'
import { Eq, getTupleEq } from 'fp-ts/Eq'
import { constVoid, flow } from 'fp-ts/function'
import { getEq } from 'fp-ts/ReadonlyArray'

import { useMemo, useRef, useState } from '../core/exports'
import { diff } from '../helpers/diff'
import { useFiber } from './useFiber'

export const useMemoListEffect = <A, E, B>(
  fn: (value: A, index: number) => Effect<E, B>,
  values: ReadonlyArray<A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<
  E &
    EnvOf<typeof useRef> &
    EnvOf<typeof useState> &
    EnvOf<typeof useMemo> &
    EnvOf<typeof useFiber>,
  ReadonlyArray<B>
> => {
  const eff = doEffect(function* () {
    const previousValues = yield* useRef<{}, ReadonlyArray<A>>(Pure.fromIO(() => values.slice()))
    const [getStableValues, updateStableValues] = yield* useState(lazy(() => zip(values.map(fn))))
    const firstRun = yield* useRef(Pure.of(true))
    const argsEq = yield* useMemo(flow(getEq, getTupleEq), [eq])
    const diffValues = yield* useMemo(diff, [eq])

    yield* useFiber(
      (vs: ReadonlyArray<A>) => {
        if (firstRun.current) {
          firstRun.current = false

          return Pure.fromIO(constVoid)
        }

        const { added, removed } = diffValues(previousValues.current, values)

        if (added.length === 0 && removed.length === 0) {
          return Pure.fromIO(constVoid)
        }

        const eff = doEffect(function* () {
          previousValues.current = vs.slice()

          const stableValues = yield* getStableValues
          const addedIndexes = new Set(added.map(([, i]) => i))
          const updatedValues = yield* zip(
            vs.map((value, index) =>
              addedIndexes.has(index) ? fn(value, index) : Pure.of(stableValues[index]),
            ),
          )

          yield* updateStableValues(updatedValues)
        })

        return eff
      },
      [values],
      argsEq,
    )

    return yield* getStableValues
  })

  return eff
}
