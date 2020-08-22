import { Arity1 } from '@typed/fp/common'
import { Effect } from '@typed/fp/Effect'

import { modifyRef } from './modifyRef'
import { readRef } from './readRef'
import { Ref, RefEnv, RefValue } from './Ref'
import { writeRef } from './writeRef'

export const useRef = (<R extends Ref<any, any>>(R: R) => {
  return [readRef<R>(R), writeRef<R>(R), modifyRef<R>(R)] as const
}) as {
  <R extends Ref<any, any>, E extends RefEnv<R> = RefEnv<R>>(R: R): readonly [
    Effect<E, RefValue<R>>,
    <A extends RefValue<R>>(value: A) => Effect<E, A>,
    <A extends RefValue<R>>(modify: Arity1<A, A>) => Effect<E, A>,
  ]
  <K, A>(R: Ref<K, A>): readonly [
    Effect<RefEnv<typeof R>, A>,
    (value: A) => Effect<RefEnv<typeof R>, A>,
    (modify: Arity1<A, A>) => Effect<RefEnv<typeof R>, A>,
  ]
}
