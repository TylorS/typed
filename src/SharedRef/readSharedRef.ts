import { doEffect, Effect } from '@typed/fp/Effect/exports'

import { And } from '../common/exports'
import { retrieveSharedRef, retrieveSharedRefs } from './retrieveSharedRef'
import { SharedRef, SharedRefEnv, SharedRefValue } from './SharedRef'

export const readSharedRef = <R extends SharedRef<any, any>>(
  shared: R,
): Effect<SharedRefEnv<R>, SharedRefValue<R>> =>
  doEffect(function* () {
    const ref = yield* retrieveSharedRef<R>(shared)

    return ref.current
  })

export const readSharedRefs = <Refs extends ReadonlyArray<SharedRef<any, any>>>(
  ...refs: Refs
): CombinedReadRefEffect<Refs> => {
  const eff = doEffect(function* () {
    const all = yield* retrieveSharedRefs(...refs)

    return all.map((ref) => ref.current)
  })

  return (eff as unknown) as CombinedReadRefEffect<Refs>
}

export type CombinedReadRefEffect<Refs extends ReadonlyArray<SharedRef<any, any>>> = Effect<
  And<{ [K in keyof Refs]: Refs[K] extends SharedRef<any, any> ? SharedRefEnv<Refs[K]> : unknown }>,
  { [K in keyof Refs]: SharedRefValue<Refs[K]> }
>
