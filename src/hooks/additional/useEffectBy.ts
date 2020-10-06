import { disposeNone } from '@most/disposable'
import { deepEqualsEq } from '@typed/fp/common/exports'
import { ask, doEffect, Effect, EnvOf, execEffect, Pure, zip } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { UuidEnv } from '@typed/fp/Uuid/exports'
import { Eq, eqNumber, getTupleEq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import { getEq } from 'fp-ts/ReadonlyArray'

import {
  getKeyedEnvironment,
  HookRefEnvs,
  removeKeyedEnvironment,
  useDisposable,
} from '../core/exports'
import { runWithHooks, useMemo, useRef, useState } from '../exports'
import { diff } from '../helpers/diff'
import { useCallback } from './exports'
import { useFiber } from './useFiber'
import { useHookEnvironmentRef } from './useHookEnvironmentRef'
import { useMemoFunction } from './useMemoFunction'

export const useEffectBy = <A, B, E, C>(
  values: ReadonlyArray<A>,
  identify: (a: A, index: number) => B,
  fn: (a: A, index: number, key: B) => Effect<E & HookRefEnvs, C>,
  eq: Eq<A> = deepEqualsEq,
): Effect<E & HookRefEnvs & UuidEnv & EnvOf<typeof useFiber>, ReadonlyArray<C>> => {
  const eff = doEffect(function* () {
    const diffValues = yield* useMemo(diff, [eq])
    const identifyEq = yield* useMemo((e) => getTupleEq(e, eqNumber), [eq])
    const [memoIdentity, remove] = yield* useMemoFunction(identify, identifyEq)
    const onRemoved = yield* useCallback(
      (value: A, index: number) =>
        doEffect(function* () {
          const key = memoIdentity(value, index)

          yield* removeKeyedEnvironment(key)

          remove(value, index)
        }),
      [memoIdentity, remove],
    )
    const runEffect = yield* useCallback(
      (
        value: A,
        index: number,
      ): Effect<
        E &
          HookRefEnvs &
          SchedulerEnv &
          EnvOf<typeof getKeyedEnvironment> &
          EnvOf<typeof runWithHooks>,
        C
      > =>
        doEffect(function* () {
          const key = memoIdentity(value, index)
          const requirements = yield* getKeyedEnvironment(key)
          const effect = fn(value, index, key)

          return yield* runWithHooks(requirements, effect)
        }),
      [],
    )
    const previousValues = yield* useRef(Pure.fromIO((): ReadonlyArray<A> => values.slice()))
    const effects = values.map(runEffect)
    const [getStableValues, updateStableValues] = yield* useState(zip(effects))
    const firstRun = yield* useRef(Pure.of(true))
    const env = yield* ask<E & HookRefEnvs & UuidEnv & EnvOf<typeof useFiber>>()
    const argsEq = yield* useMemo(flow(getEq, getTupleEq), [eq])

    yield* useDisposable(
      (vs: ReadonlyArray<A>) => {
        if (firstRun.current) {
          firstRun.current = false

          return disposeNone()
        }

        const eff = doEffect(function* () {
          const { added, removed } = diffValues(previousValues.current, values)

          if (added.length === 0 && removed.length === 0) {
            return
          }

          previousValues.current = vs.slice()

          const updatedValues = yield* zip(values.map(runEffect))

          yield* updateStableValues(updatedValues)

          yield* zip(removed.map(([v, i]) => onRemoved(v, i)))
        })

        return pipe(eff, execEffect(env))
      },
      [values],
      argsEq,
    )

    return yield* getStableValues
  })

  const withRequirements = doEffect(function* () {
    const requirements = yield* useHookEnvironmentRef

    return yield* runWithHooks(requirements, eff)
  })

  return withRequirements
}
