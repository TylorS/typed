import { deepEqualsEq } from '@typed/fp/common/exports'
import { Arity1 } from '@typed/fp/common/types'
import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { HookOpEnvs, useMemo, useState } from '@typed/fp/hooks/exports'
import { Either, isRight, map } from 'fp-ts/Either'
import { Eq, eqStrict, getTupleEq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { DecodeError, Decoder } from 'io-ts/Decoder'

export type UseFormOptions<E, A, B, C> = {
  readonly initialState: Effect<E, A>
  readonly decoder: Decoder<unknown, B> | Decoder<A, B>
  readonly onFormSubmit: Arity1<B, C>
  readonly eq?: Eq<A>
}

export const getReadonlyTupleEq = <A extends readonly any[]>(
  ...eqs: { readonly [K in keyof A]: Eq<A[K]> }
): Eq<Readonly<A>> => {
  return getTupleEq(...eqs) as any
}

export const useForm = <E, A, B, C>(
  options: UseFormOptions<E, A, B, C>,
): Effect<E & HookOpEnvs, UseForm<A, B, C>> => {
  const { initialState, decoder, onFormSubmit, eq = deepEqualsEq } = options

  const eff = doEffect(function* () {
    const [getState, updateState] = yield* useState(initialState, eq)

    const a = yield* getState

    const validation = yield* useMemo(
      (d, a) => d.decode(a),
      [decoder, a] as const,
      getReadonlyTupleEq(eqStrict, eq),
    )

    const submitForm = yield* useMemo(
      (_) =>
        doEffect(function* () {
          const a = yield* getState

          return pipe(a, decoder.decode, map(onFormSubmit))
        }),
      [decoder, onFormSubmit],
    )

    return {
      getState,
      updateState,
      validation,
      isValid: isRight(validation),
      submitForm,
    }
  })

  return eff
}

export type UseForm<A, B, C> = {
  readonly getState: Pure<A>
  readonly updateState: (update: Arity1<A, A>) => Pure<A>
  readonly validation: Either<DecodeError, B>
  readonly isValid: boolean
  readonly submitForm: Pure<Either<DecodeError, C>>
}
