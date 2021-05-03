import { Env } from '@fp/Env'
import * as Eq from '@fp/Eq'
import { CurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { getRef, setRef } from '@fp/Ref'
import { pipe } from 'cjs/function'

import { DepsArgs, getDeps } from './Deps'
import { useEq } from './useEq'
import { useRef } from './useRef'

export const useMemo = <E, A, Deps extends ReadonlyArray<any> = []>(
  env: Env<E, A>,
  ...args: DepsArgs<Deps>
): Env<E & CurrentFiber, A> =>
  usingFiberRefs(
    Do(function* (_) {
      const [deps, eqs] = getDeps(args)
      const ref = yield* _(useRef(env))
      const isEqual = yield* _(useEq(deps, Eq.tuple(...eqs)))

      if (!isEqual) {
        yield* pipe(yield* _(env), setRef(ref), _)
      }

      return yield* _(getRef(ref))
    }),
  )
