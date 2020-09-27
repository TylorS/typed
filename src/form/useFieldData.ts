import { deepEqualsEq } from '@typed/fp/common/exports'
import { Arity1 } from '@typed/fp/common/types'
import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import {
  HookOpEnvs,
  useCallback,
  useMemo,
  useRef,
  UseState,
  useState,
} from '@typed/fp/hooks/exports'
import { Eq, eqBoolean } from 'fp-ts/Eq'

import { FieldData, FieldState } from './FieldState'

export function useFieldData<K, A>(
  key: K,
  [getA, updateA]: UseState<A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<HookOpEnvs, FieldState<K, A>> {
  return doEffect(function* () {
    const isDirty = yield* useRef(Pure.of(false))
    const isPristine = yield* useRef(Pure.of(true))
    const [getHasBlurred, setHasBlurred] = yield* useState(Pure.of(false), eqBoolean)

    const update = yield* useCallback(
      (f: Arity1<A, A>) =>
        doEffect(function* () {
          const current = yield* getA
          const updated = f(current)
          const areEqual = eq.equals(current, updated)

          isPristine.current = false
          isDirty.current = !areEqual

          if (!areEqual) {
            return yield* updateA(() => updated)
          }

          return current
        }),
      [eq],
    )

    const fieldData = yield* useMemo(
      (e, hasBlurred): FieldData<K, A> => ({
        key,
        eq: e,
        hasBlurred,
        get isDirty() {
          return isDirty.current
        },
        get isPristine() {
          return isPristine.current
        },
      }),
      [eq, yield* getHasBlurred] as const,
    )

    return [getA, update, fieldData, { setHasBlurred }] as const
  })
}
