import { Effect } from '@typed/fp/Effect/exports'
import { callOp } from '@typed/fp/Op/exports'

import { Ref } from './Ref'
import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export function retrieveSharedRef<R extends SharedRef<any, any>>(
  ref: R,
): Effect<SharedRefEnv<typeof ref>, Ref<SharedRefValue<R>>>

export function retrieveSharedRef<K extends PropertyKey, A>(
  ref: SharedRef<K, A>,
): Effect<SharedRefEnv<typeof ref>, Ref<A>>

export function retrieveSharedRef<K extends PropertyKey, A>(
  ref: SharedRef<K, A>,
): Effect<SharedRefEnv<typeof ref>, Ref<A>> {
  return callOp<typeof ref>(ref)()
}
