import { deepEqualsEq } from '@typed/fp/common'
import { doEffect, Effect, lazy, Pure, zip } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'
import { Eq } from 'fp-ts/es6/Eq'

import { HookOpEnvs, useRef, useState } from '../domain'
import { diff } from './diff'
import { useEffect } from './useEffect'

export type UseMemoListEffectOptions<A, E> = {
  readonly onRemoved?: (value: A, index: number) => Effect<E, void>
}

export const useMemoListEffect = <A, E1, B, E2>(
  fn: (value: A, index: number) => Effect<E1, B>,
  values: ReadonlyArray<A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E1 & E2 & HookOpEnvs & SchedulerEnv, ReadonlyArray<B>> => {
  const diffValues = diff(eq)

  const eff = doEffect(function* () {
    const previousValues = yield* useRef<{}, ReadonlyArray<A>>(Pure.fromIO(() => values.slice()))
    const [getStableValues, updateStableValues] = yield* useState(lazy(() => zip(values.map(fn))))
    const firstRun = yield* useRef(Pure.of(true))

    yield* useEffect(
      function* (vs) {
        if (firstRun.current) {
          firstRun.current = false

          return
        }

        const { added, removed } = diffValues(previousValues.current, values)

        if (added.length === 0 && removed.length === 0) {
          return
        }

        previousValues.current = vs.slice()

        const stableValues = yield* getStableValues
        const addedIndexes = new Set(added.map(([, i]) => i))
        const updatedValues = yield* zip(
          vs.map((value, index) =>
            addedIndexes.has(index) ? fn(value, index) : Pure.of(stableValues[index]),
          ),
        )

        yield* updateStableValues(() => updatedValues)
      },
      [values] as const,
    )

    return yield* getStableValues
  })

  return eff as Effect<E1 & HookOpEnvs & SchedulerEnv, ReadonlyArray<B>>
}
