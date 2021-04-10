import { Env } from '@fp/Env'
import * as Eq from '@fp/Eq'
import { Do } from '@fp/Fx/Env'
import * as RA from 'fp-ts/ReadonlyArray'

import { useEq } from './useEq'
import { useRef } from './useRef'

export const useMemo = <E, A, Deps extends ReadonlyArray<any> = []>(
  env: Env<E, A>,
  deps: Deps = [] as any,
  eqs: { readonly [K in keyof Deps]: Eq.Eq<Deps[K]> } = RA.getEq(Eq.deepEqualsEq) as any,
) =>
  Do(function* (_) {
    const ref = yield* _(useRef(env))
    const isEqual = yield* _(useEq(deps, Eq.tuple(...eqs), false))

    if (!isEqual) {
      ref.current = yield* _(env)
    }

    return ref.current
  })
