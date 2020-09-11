import { deepEqualsEq } from '@typed/fp/common/exports'
import { Disposable, disposeAll, disposeNone } from '@typed/fp/Disposable/exports'
import { ask, doEffect, Effect, Pure, runEffect } from '@typed/fp/Effect/exports'
import { Fn } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlyArray'

import { HookOpEnvs, Ref, useRef } from '../domain/exports'
import { addDisposable } from '../domain/services/operations/addDisposable'
import { useDepChange } from './useDepChange'

export type UseEffectOptions<Args, A> = {
  readonly onReturn?: (value: A) => Disposable
  readonly eq?: Eq<Args>
}

export const useEffect = <Args extends ReadonlyArray<any>, E, A>(
  fn: Fn<Args, Effect<E, A>>,
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
      const disposable = runEffect(
        (u) => (isDisposable(u) ? disposeAll([u, onReturn(u)]) : onReturn(u)),
        e,
        fn(...args),
      )
      const cleanup = yield* addDisposable(disposable)

      ref.current = disposeAll([disposable, cleanup])
    }

    return ref.current
  })

  return eff
}

function isDisposable(x: unknown): x is Disposable {
  return !!x && typeof x === 'object' && typeof (x as { dispose?: Function }).dispose === 'function'
}
