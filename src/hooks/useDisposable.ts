import { Env, fromIO } from '@fp/Env'
import * as Eq from '@fp/Eq'
import { CurrentFiber, withFiberRefs } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { Disposable } from '@most/types'

import { DepsArgs, getDeps } from './Deps'
import { useEq } from './useEq'
import { useRef } from './useRef'

export const useDisposable = <Deps extends ReadonlyArray<any> = []>(
  f: () => Disposable,
  ...args: DepsArgs<Deps>
): Env<CurrentFiber, Disposable> =>
  withFiberRefs(
    Do(function* (_) {
      const [deps, eqs] = getDeps(args)
      const ref = yield* _(useRef(fromIO<Disposable>(f)))
      const isEqual = yield* _(useEq(deps, Eq.tuple(...eqs)))

      if (!isEqual) {
        ref.current.dispose()
        ref.current = f()
      }

      return ref.current
    }),
  )
