import { Arity1 } from '@typed/fp/common/types'
import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { Either, map } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { HookOpEnvs, useCallback } from '../hooks/exports'
import { FormState, updateHasBeenSubmitted } from './FormState'

/**
 * Create an onSubmit handler that does not submit when the form
 * is not yet valid.
 */
export function useValidFormSubmit<A, B, C, D>(
  formState: FormState<A>,
  validation: Either<B, C>,
  onSubmit: Arity1<C, D>,
): Effect<HookOpEnvs, () => Pure<Either<B, D>>> {
  return useCallback(
    () =>
      doEffect(function* () {
        yield* updateHasBeenSubmitted(formState, true)

        return pipe(validation, map(onSubmit))
      }),
    [validation],
  )
}
