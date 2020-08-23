import { Arity1 } from '@typed/fp/common'
import { Effect } from '@typed/fp/Effect'

import { modifySharedRef } from './modifySharedRef'
import { readSharedRef } from './readSharedRef'
import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'
import { writeSharedRef } from './writeSharedRef'

export const wrapSharedRef = (<R extends SharedRef<any, any>>(R: R) => {
  return [readSharedRef<R>(R), writeSharedRef<R>(R), modifySharedRef<R>(R)] as const
}) as {
  <R extends SharedRef<any, any>, E extends SharedRefEnv<R> = SharedRefEnv<R>>(R: R): readonly [
    Effect<E, SharedRefValue<R>>,
    <A extends SharedRefValue<R>>(value: A) => Effect<E, A>,
    <A extends SharedRefValue<R>>(modify: Arity1<A, A>) => Effect<E, A>,
  ]
  <K, A>(R: SharedRef<K, A>): readonly [
    Effect<SharedRefEnv<typeof R>, A>,
    (value: A) => Effect<SharedRefEnv<typeof R>, A>,
    (modify: Arity1<A, A>) => Effect<SharedRefEnv<typeof R>, A>,
  ]
}
