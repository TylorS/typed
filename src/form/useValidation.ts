import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { HookOpEnvs, useMemo, UseState } from '@typed/fp/hooks/exports'
import { getEq } from 'fp-ts/Either'
import { Eq, getTupleEq } from 'fp-ts/Eq'
import { Either, isLeft, isRight } from 'fp-ts/lib/Either'

export type UseValidationOptions<A, B, C> = {
  readonly stateEq?: Eq<A>
  readonly errorEq?: Eq<B>
  readonly valueEq?: Eq<C>
}

export function useValidation<A, B extends ReadonlyArray<any>, C, D>(
  state: readonly [...UseState<A>, ...B],
  validate: (value: A) => Either<C, D>,
  options: UseValidationOptions<A, C, D> = {},
): Effect<HookOpEnvs, ValidationObj<C, D>> {
  const { stateEq = deepEqualsEq, errorEq = deepEqualsEq, valueEq = deepEqualsEq } = options
  const [getA] = state

  const eff = doEffect(function* () {
    const a = yield* getA
    const eq = yield* useMemo(getTupleEq, [stateEq])
    const validation = yield* useMemo(validate, [a], eq)
    const validationEq = yield* useMemo((e, v) => getTupleEq(getEq(e, v)), [
      errorEq,
      valueEq,
    ] as const)

    return yield* useMemo(toValidationObj, [validation], validationEq)
  })

  return eff
}

export type ValidationObj<A, B> = {
  readonly validation: Either<A, B>
  readonly isValid: boolean
  readonly isInvalid: boolean
}

function toValidationObj<A, B>(validation: Either<A, B>): ValidationObj<A, B> {
  return {
    validation,
    isValid: isRight(validation),
    isInvalid: isLeft(validation),
  }
}
