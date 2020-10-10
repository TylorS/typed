import { disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect, EnvOf, Pure } from '@typed/fp/Effect/exports'
import { Fiber, FiberEnv, fork } from '@typed/fp/fibers/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { createRef, Ref } from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlyArray'

import { addDisposable, getHookEnv, useDepChange, useMemo, useRef } from '../core/exports'

export const useFiber = <A extends ReadonlyArray<any>, B, C>(
  f: Fn<A, Effect<B, C>>,
  args: A | Readonly<A>,
  eq: Eq<A> | Eq<Readonly<A>> = getEq(deepEqualsEq),
): Effect<
  B & FiberEnv & EnvOf<typeof useDepChange> & EnvOf<typeof useMemo> & EnvOf<typeof addDisposable>,
  Fiber<C>
> => {
  const eff = doEffect(function* () {
    const env = yield* getHookEnv
    const depsChanged = yield* useDepChange(args, eq, true)
    const ref: Ref<Fiber<C> | undefined> = yield* useMemo(() => createRef<Fiber<C>>(), [])
    const disposable: Ref<Disposable> = yield* useRef(Pure.fromIO(disposeNone))

    if (depsChanged) {
      disposable.current.dispose()
      ref.current?.dispose()

      const fiber = yield* fork(f(...args))

      ref.current = fiber

      disposable.current = yield* addDisposable(env.id, fiber)
    }

    return ref.current!
  })

  return eff
}
