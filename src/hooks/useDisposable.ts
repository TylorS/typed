import { Env, fromIO } from '@fp/Env'
import { addDisposable, CurrentFiber, DoF } from '@fp/Fiber'
import { dispose, disposeAll } from '@most/disposable'
import { Disposable } from '@most/types'

import { DepsArgs, useDeps } from './Deps'
import { useRef } from './useRef'

export const useDisposable = <Deps extends ReadonlyArray<any> = []>(
  f: () => Disposable,
  ...args: DepsArgs<Deps>
): Env<CurrentFiber, Disposable> =>
  DoF(function* (_) {
    const ref = yield* _(useRef(fromIO<Disposable>(f)))
    const isEqual = yield* _(useDeps(...args))

    if (!isEqual) {
      dispose(yield* _(ref.get))

      const userDisposable = f()
      const fiberDisposable = yield* _(addDisposable(userDisposable))
      const disposable = disposeAll([userDisposable, fiberDisposable])

      return yield* _(ref.set(disposable))
    }

    return yield* _(ref.get)
  })
