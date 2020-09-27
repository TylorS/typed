import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { HookOpEnvs, useEffectBy, useMemo, UseState } from '@typed/fp/hooks/exports'
import { UuidEnv } from '@typed/fp/Uuid/exports'
import { Eq } from 'fp-ts/Eq'
import { identity, pipe } from 'fp-ts/function'

import { applyLens } from './applyLens'
import { FieldState } from './FieldState'
import { FormDataObj } from './FormDataObj'
import { getLensProps } from './getLensProps'
import { getKey, ownKeys } from './reflection'
import { useFieldData } from './useFieldData'

export function useFieldStates<A extends FormDataObj>(
  state: UseState<A>,
  eqs: Partial<EqsOf<A>> = {},
): Effect<SchedulerEnv & UuidEnv & HookOpEnvs, FieldStatesOf<A>> {
  const eff = doEffect(function* () {
    const [getA] = state
    const a = yield* getA
    const keys = yield* useMemo(ownKeys, [a])
    const lenses = yield* useMemo(getLensProps, [a])
    const fieldStates = yield* useEffectBy(keys, identity, (key) =>
      doEffect(function* () {
        const lensed = pipe(lenses, getKey(key), applyLens(state))
        const fieldState = yield* useFieldData(key, lensed, pipe(eqs, getKey(key)) ?? deepEqualsEq)

        return [key, fieldState] as const
      }),
    )

    return yield* useMemo((fs) => (Object.fromEntries(fs) as unknown) as FieldStatesOf<A>, [
      fieldStates,
    ])
  })

  return eff
}

export type EqsOf<A extends FormDataObj> = {
  readonly [K in keyof A]: Eq<A[K]>
}

export type FieldStatesOf<A extends FormDataObj> = {
  readonly [K in keyof A]: FieldState<A[K], K>
}
