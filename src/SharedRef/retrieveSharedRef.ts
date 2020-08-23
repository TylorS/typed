import { Effect } from '@typed/fp/Effect'
import { callOp } from '@typed/fp/Op'
import { IORef } from 'fp-ts/es6/IORef'

import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export const retrieveSharedRef = <R extends SharedRef<any, any>>(
  ref: R,
): Effect<SharedRefEnv<R>, IORef<SharedRefValue<R>>> => callOp<R>(ref)()
