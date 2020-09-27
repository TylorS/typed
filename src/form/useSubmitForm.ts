import { Arity1 } from '@typed/fp/common/types'
import { Effect } from '@typed/fp/Effect/exports'
import { Either, map } from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'

import { HookOpEnvs, useCallback } from '../hooks/exports'

export function useSubmitForm<L, A, B>(
  validation: Either<L, A>,
  onSubmit: Arity1<A, B>,
): Effect<HookOpEnvs, () => Either<L, B>> {
  return useCallback(() => pipe(validation, map(onSubmit)), [validation])
}
