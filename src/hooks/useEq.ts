import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Ref'
import { constant } from 'cjs/function'
import { Eq } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'

import { useRef } from './useRef'

export const useEq = <A>(value: A, eq: Eq<A>, firstRun = true): E.Env<F.CurrentFiber, boolean> =>
  F.usingFiberRefs(
    Do(function* (_) {
      const ref = yield* pipe(O.none as O.Option<A>, E.of, useRef, _)
      const current = yield* pipe(ref, R.getRef, _)

      yield* pipe(value, O.some, R.setRef(ref), _)

      return pipe(current, O.match(constant(firstRun), eq.equals(value)))
    }),
  )
