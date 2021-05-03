import { Env, fromIO } from '@fp/Env'
import * as Eq from '@fp/Eq'
import { CurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { getRef, setRef } from '@fp/Ref'
import { Disposable } from '@most/types'
import { pipe } from 'cjs/function'

import { DepsArgs, getDeps } from './Deps'
import { useEq } from './useEq'
import { useRef } from './useRef'

export const useDisposable = <Deps extends ReadonlyArray<any> = []>(
  f: () => Disposable,
  ...args: DepsArgs<Deps>
): Env<CurrentFiber, Disposable> =>
  usingFiberRefs(
    Do(function* (_) {
      const [deps, eqs] = getDeps(args)
      const ref = yield* _(useRef(fromIO<Disposable>(f)))
      const isEqual = yield* _(useEq(deps, Eq.tuple(...eqs)))

      if (!isEqual) {
        const current = yield* _(getRef(ref))

        current.dispose()

        return yield* _(pipe(f(), setRef(ref)))
      }

      return yield* _(getRef(ref))
    }),
  )
