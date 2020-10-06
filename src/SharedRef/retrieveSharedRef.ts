import { Effect } from '@typed/fp/Effect/exports'
import { callOp } from '@typed/fp/Op/exports'
import { IORef } from 'fp-ts/IORef'

import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export function retrieveSharedRef<R extends SharedRef<any, any>>(
  ref: R,
): Effect<SharedRefEnv<typeof ref>, IORef<SharedRefValue<R>>>

export function retrieveSharedRef<K extends PropertyKey, A>(
  ref: SharedRef<K, A>,
): Effect<SharedRefEnv<typeof ref>, IORef<A>>

export function retrieveSharedRef<K extends PropertyKey, A>(
  ref: SharedRef<K, A>,
): Effect<SharedRefEnv<typeof ref>, IORef<A>> {
  return callOp<typeof ref>(ref)()
}
