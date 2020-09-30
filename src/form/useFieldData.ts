import { deepEqualsEq } from '@typed/fp/common/exports'
import { Arity1 } from '@typed/fp/common/types'
import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { HookOpEnvs, useCallback, useMemo, useRef, useState } from '@typed/fp/hooks/exports'
import { Eq, eqBoolean } from 'fp-ts/Eq'

import { CurrentState } from './CurrentState'
import { FieldData, FieldState } from './FieldState'

/**
 * Create a FieldState from a key, state, and optionally an Eq.
 */
export function useFieldData<K, A>(
  key: K,
  [a, updateA]: CurrentState<A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<HookOpEnvs, FieldState<K, A>> {
  return doEffect(function* () {
    const isDirty = yield* useRef(Pure.of(false))
    const isPristine = yield* useRef(Pure.of(true))
    const [getHasBlurred, updateHasBlurred] = yield* useState(Pure.of(false), eqBoolean)

    const update = yield* useCallback(
      (f: Arity1<A, A>) =>
        doEffect(function* () {
          const updated = f(a)
          const areEqual = eq.equals(a, updated)

          isPristine.current = false
          isDirty.current = !areEqual

          if (!areEqual) {
            return yield* updateA(() => updated)
          }

          return a
        }),
      [a, eq],
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

    return [a, update, fieldData, { updateHasBlurred }] as const
  })
}
