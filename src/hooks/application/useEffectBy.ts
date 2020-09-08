import { deepEqualsEq } from '@typed/fp/common'
import { doEffect, Effect, Pure, zip } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'
import { UuidEnv } from '@typed/fp/Uuid'
import { Eq, eqNumber, getTupleEq } from 'fp-ts/es6/Eq'

import {
  getKeyedRequirements,
  HookOpEnvs,
  removeKeyedRequirements,
  runWithHooks,
  useRef,
  useState,
} from '../domain'
import { diff } from './diff'
import { useCallback } from './useCallback'
import { useEffect } from './useEffect'
import { useHookRequirementsRef } from './useHookRequirementsRef'
import { useMemo } from './useMemo'
import { useMemoFunction } from './useMemoFunction'

export const useEffectBy = <A, B, E, C>(
  values: ReadonlyArray<A>,
  identify: (a: A, index: number) => B,
  fn: (a: A, index: number, key: B) => Effect<E & HookOpEnvs, C>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E & HookOpEnvs & SchedulerEnv & UuidEnv, ReadonlyArray<C>> => {
  const eff = doEffect(function* () {
    const diffValues = yield* useMemo(diff, [eq])
    const identifyEq = yield* useMemo((e) => getTupleEq(e, eqNumber), [eq])
    const [memoIdentity, remove] = yield* useMemoFunction(identify, identifyEq)
    const onRemoved = yield* useCallback(
      (value: A, index: number) =>
        doEffect(function* () {
          const key = memoIdentity(value, index)

          yield* removeKeyedRequirements(key)

          remove(value, index)
        }),
      [memoIdentity, remove],
    )
    const runEffect = yield* useCallback(
      (value: A, index: number): Effect<E & HookOpEnvs, C> =>
        doEffect(function* () {
          const key = memoIdentity(value, index)
          const requirements = yield* getKeyedRequirements(key)
          const effect = fn(value, index, key)

          return yield* runWithHooks(effect, requirements)
        }),
      [],
    )
    const previousValues = yield* useRef<{}, ReadonlyArray<A>>(Pure.fromIO(() => values.slice()))
    const [getStableValues, updateStableValues] = yield* useState(zip(values.map(runEffect)))
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

        const updatedValues = yield* zip(vs.map(runEffect))

        yield* updateStableValues(() => updatedValues)

        yield* zip(removed.map(([v, i]) => onRemoved(v, i)))
      },
      [values] as const,
    )

    return yield* getStableValues
  })

  const withRequirements = doEffect(function* () {
    const requirements = yield* useHookRequirementsRef

    return yield* runWithHooks(eff, requirements)
  })

  return withRequirements
}
