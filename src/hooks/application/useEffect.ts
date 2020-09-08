import { deepEqualsEq } from '@typed/fp/common'
import { Disposable, disposeAll, disposeNone } from '@typed/fp/Disposable'
import { ask, doEffect, Effect, EffectGenerator, Pure, runEffect } from '@typed/fp/Effect'
import { Fn } from '@typed/fp/lambda'
import { Eq } from 'fp-ts/es6/Eq'
import { getEq } from 'fp-ts/es6/ReadonlyArray'

import { HookOpEnvs, Ref, useRef } from '../domain'
import { addDisposable } from '../domain/services/operations/addDisposable'
import { useDepChange } from './useDepChange'

export type UseEffectOptions<Args, A> = {
  readonly onReturn?: (value: A) => Disposable
  readonly eq?: Eq<Args>
}

export const useEffect = <Args extends ReadonlyArray<any>, E, A>(
  fn: Fn<Args, EffectGenerator<E, A>>,
  args: Args,
  options: UseEffectOptions<Args, A> = {},
): Effect<E & HookOpEnvs, Disposable> => {
  const { onReturn = disposeNone, eq = getEq(deepEqualsEq) } = options

  const eff = doEffect(function* () {
    const depsChanged = yield* useDepChange(args, eq, true)
    const ref: Ref<Disposable> = yield* useRef(Pure.fromIO(disposeNone))

    if (depsChanged) {
      ref.current.dispose()

      const e = yield* ask<E>()
      const disposable = runEffect(onReturn, e, fn(...args))
      const cleanup = yield* addDisposable(disposable)

      ref.current = disposeAll([disposable, cleanup])
    }

    return ref.current
  })

  return eff
}
