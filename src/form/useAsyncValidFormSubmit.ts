import { Arity1 } from '@typed/fp/common/types'
import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { HookOpEnvs, useCallback } from '@typed/fp/hooks/exports'
import { map, RemoteData } from '@typed/fp/RemoteData/exports'
import { pipe } from 'fp-ts/function'

import { FormState, updateHasBeenSubmitted } from './FormState'

/**
 * Create an onSubmit handler that does not submit when the form
 * is not yet valid.
 */
export function useAsyncValidFormSubmit<A, B, C, D>(
  formState: FormState<A>,
  validation: RemoteData<B, C>,
  onSubmit: Arity1<C, D>,
): Effect<HookOpEnvs, () => Pure<RemoteData<B, D>>> {
  return useCallback(
    () =>
      doEffect(function* () {
        yield* updateHasBeenSubmitted(formState, true)

        return pipe(validation, map(onSubmit))
      }),
    [validation],
  )
}
