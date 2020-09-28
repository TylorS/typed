import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { Future } from '@typed/fp/Future/exports'
import { HookOpEnvs, useEffect, useMemo, useState } from '@typed/fp/hooks/exports'
import {
  fold,
  fromEither,
  getEq,
  NoData,
  RemoteData,
  toLoading,
} from '@typed/fp/RemoteData/exports'
import { Eq, getTupleEq } from 'fp-ts/Eq'
import { constant, pipe } from 'fp-ts/function'
import { none, Option, some } from 'fp-ts/Option'

import { CurrentState } from './CurrentState'

const constNone = constant(none)

export type UseAsyncValidationOptions<A, B, C> = {
  readonly stateEq?: Eq<A>
  readonly errorEq?: Eq<B>
  readonly valueEq?: Eq<C>
}

export function useAsyncValidation<A, B extends ReadonlyArray<any>, E, C, D>(
  state: readonly [...CurrentState<A>, ...B],
  validate: (value: A) => Future<E, C, D>,
  options: UseAsyncValidationOptions<A, C, D> = {},
): Effect<E & HookOpEnvs, AsyncValidationObj<C, D>> {
  const { stateEq = deepEqualsEq, errorEq = deepEqualsEq, valueEq = deepEqualsEq } = options
  const [a] = state

  const eff = doEffect(function* () {
    const [getValidation, setValidation] = yield* useState<{}, RemoteData<C, D>>(Pure.of(NoData))
    const options = yield* useMemo((e) => (e ? { eq: getTupleEq(e) } : {}), [stateEq])
    const validationEq = yield* useMemo((e, v) => getTupleEq(getEq(e, v)), [
      errorEq,
      valueEq,
    ] as const)

    yield* useEffect(
      (a) =>
        doEffect(function* () {
          yield* setValidation(toLoading)

          const either = yield* validate(a)

          yield* setValidation(() => fromEither(either))
        }),
      [a],
      options,
    )

    return yield* useMemo(toAsyncValidationObj, [yield* getValidation], validationEq)
  })

  return eff
}

export type AsyncValidationObj<A, B> = {
  readonly validation: RemoteData<A, B>
  readonly isValid: Option<boolean>
  readonly isInvalid: Option<boolean>
}

export const getAsyncValidation = <A, B>(vo: AsyncValidationObj<A, B>): RemoteData<A, B> =>
  vo.validation

export const getAsyncIsValid = <A, B>(vo: AsyncValidationObj<A, B>): Option<boolean> => vo.isValid

export const getAsyncIsInvalid = <A, B>(vo: AsyncValidationObj<A, B>): Option<boolean> =>
  vo.isInvalid

function toAsyncValidationObj<A, B>(validation: RemoteData<A, B>): AsyncValidationObj<A, B> {
  return {
    validation,
    isValid: pipe(
      validation,
      fold(
        constNone,
        constNone,
        () => some(false),
        () => some(true),
      ),
    ),
    isInvalid: pipe(
      validation,
      fold(
        constNone,
        constNone,
        () => some(true),
        () => some(false),
      ),
    ),
  }
}
