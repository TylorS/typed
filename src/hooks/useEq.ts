import * as E from '@fp/Env'
import * as F from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Eq } from 'fp-ts/Eq'
import { constant } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

import { useRef } from './useRef'

export const useEq = <A>(value: A, eq: Eq<A>, firstRun = true): E.Env<F.CurrentFiber, boolean> =>
  F.DoF(function* (_) {
    const ref = yield* pipe(O.none as O.Option<A>, E.of, useRef, _)
    const current = yield* _(ref.get)

    yield* pipe(value, O.some, ref.set, _)

    return pipe(current, O.match(constant(firstRun), eq.equals(value)))
  })
