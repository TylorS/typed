import { Effect } from '@typed/fp/Effect/exports'
import { callOp } from '@typed/fp/Op/exports'
import { IORef } from 'fp-ts/IORef'

import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export const retrieveSharedRef = <R extends SharedRef<any, any>>(
  ref: R,
): Effect<SharedRefEnv<R>, IORef<SharedRefValue<R>>> => callOp<R>(ref)()
