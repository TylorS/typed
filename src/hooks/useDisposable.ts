import { Env, fromIO } from '@fp/Env'
import { CurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { getRef, setRef } from '@fp/Ref'
import { Disposable } from '@most/types'
import { pipe } from 'fp-ts/function'

import { DepsArgs, useDeps } from './Deps'
import { useRef } from './useRef'

export const useDisposable = <Deps extends ReadonlyArray<any> = []>(
  f: () => Disposable,
  ...args: DepsArgs<Deps>
): Env<CurrentFiber, Disposable> =>
  usingFiberRefs(
    Do(function* (_) {
      const ref = yield* _(useRef(fromIO<Disposable>(f)))
      const isEqual = yield* _(useDeps(...args))

      if (!isEqual) {
        const current = yield* _(getRef(ref))

        current.dispose()

        return yield* _(pipe(f(), setRef(ref)))
      }

      return yield* _(getRef(ref))
    }),
  )
