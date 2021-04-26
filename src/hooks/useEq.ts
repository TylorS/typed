import { Env, of } from '@fp/Env'
import { CurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { Eq } from 'fp-ts/Eq'
import { isNone, none, Option, some } from 'fp-ts/Option'

import { useRef } from './useRef'

export const useEq = <A>(value: A, eq: Eq<A>, firstRun = true): Env<CurrentFiber, boolean> =>
  usingFiberRefs(
    Do(function* (_) {
      const ref = yield* _(useRef<unknown, Option<A>>(of(none)))

      if (isNone(ref.current)) {
        ref.current = some(value)

        return firstRun
      }

      const isEqual = pipe(value, eq.equals(ref.current.value))

      ref.current = some(value)

      return isEqual
    }),
  )
