import { deepEqualsEq } from '@typed/fp/common/exports'
import { Disposable, disposeAll, disposeNone } from '@typed/fp/Disposable/exports'
import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { Ref, SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlyArray'

import { HookPositions, HookSymbols } from '../exports'
import { addDisposable, HookDisposables } from '../sharedRefs/HookDisposables'
import { getHookEnv, HookEnv } from '../types/HookEnvironment'
import { useDepChange } from './useDepChange'
import { useRef } from './useRef'

export const useDisposable = <A extends ReadonlyArray<any>>(
  f: Fn<A, Disposable>,
  args: A | Readonly<A>,
  eq: Eq<A> = getEq(deepEqualsEq),
): Effect<
  HookEnv & SharedRefEnv<HookPositions> & SharedRefEnv<HookSymbols> & SharedRefEnv<HookDisposables>,
  Disposable
> => {
  const eff = doEffect(function* () {
    const env = yield* getHookEnv
    const depsChanged = yield* useDepChange(args, eq, true)
    const ref: Ref<Disposable> = yield* useRef(Pure.fromIO(disposeNone))

    if (depsChanged) {
      ref.current.dispose()

      const disposable = f(...args)

      ref.current = disposeAll([disposable, yield* addDisposable(env.id, disposable)])
    }

    return ref.current
  })

  return eff
}
