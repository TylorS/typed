import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'
import { Fiber, FiberEnv, fork } from '@typed/fp/fibers/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlyArray'

import { createRef, Ref, useDepChange, useMemo } from '../core/exports'

export const useFiber = <A extends ReadonlyArray<any>, B, C>(
  f: Fn<A, Effect<B, C>>,
  args: A,
  eq: Eq<A> = getEq(deepEqualsEq),
): Effect<B & FiberEnv & EnvOf<typeof useDepChange> & EnvOf<typeof useMemo>, Fiber<C>> => {
  const eff = doEffect(function* () {
    const depsChanged = yield* useDepChange(args, eq, true)
    const ref: Ref<Fiber<C> | undefined> = yield* useMemo(() => createRef<Fiber<C>>(), [])

    if (depsChanged) {
      ref.current?.dispose()
      ref.current = yield* fork(f(...args))
    }

    return ref.current!
  })

  return eff
}
