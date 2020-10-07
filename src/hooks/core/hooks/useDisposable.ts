import { deepEqualsEq } from '@typed/fp/common/exports'
import { Disposable, disposeAll, disposeNone } from '@typed/fp/Disposable/exports'
import { doEffect, Pure } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlyArray'

import { Ref } from '../../../SharedRef/Ref'
import { addDisposable } from '../sharedRefs/HookDisposables'
import { getHookEnv } from '../types/HookEnvironment'
import { useDepChange } from './useDepChange'
import { useRef } from './useRef'

export const useDisposable = <A extends ReadonlyArray<any>>(
  f: Fn<A, Disposable>,
  args: A | Readonly<A>,
  eq: Eq<A> = getEq(deepEqualsEq),
) => {
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
