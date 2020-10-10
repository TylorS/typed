import { Effect, memo, ReturnOf } from '@typed/fp/Effect/exports'
import { FnOf, provideOp } from '@typed/fp/Op/exports'

import { always } from '../lambda/exports'
import { createRef } from './Ref'
import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export const provideSharedRef = <R extends SharedRef<any, any>>(
  key: R,
  value: SharedRefValue<R>,
): (<E2, A>(eff: Effect<E2 & SharedRefEnv<R>, A>) => Effect<E2, A>) => {
  return provideOp<R, unknown>(
    key,
    always(memo(Effect.fromIO(() => createRef(value) as ReturnOf<ReturnType<FnOf<R>>>))),
  )
}
