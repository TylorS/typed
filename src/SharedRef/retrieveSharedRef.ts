import { And } from '@typed/fp/common/exports'
import { doEffect, Effect, zip } from '@typed/fp/Effect/exports'
import { callOp, getOpMap } from '@typed/fp/Op/exports'

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

export function retrieveSharedRefs<Refs extends ReadonlyArray<SharedRef<any, any>>>(
  ...refs: Refs
): CombinedRetrieveRefEffect<Refs> {
  const eff = doEffect(function* () {
    const map = yield* getOpMap
    const effs = refs.map((ref) => map.get(ref)!())
    const values = yield* zip(effs)

    return values
  })

  return (eff as unknown) as CombinedRetrieveRefEffect<Refs>
}

export type CombinedRetrieveRefEffect<Refs extends ReadonlyArray<SharedRef<any, any>>> = Effect<
  And<{ [K in keyof Refs]: Refs[K] extends SharedRef<any, any> ? SharedRefEnv<Refs[K]> : unknown }>,
  { [K in keyof Refs]: Ref<SharedRefValue<Refs[K]>> }
>
