import { deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Pure } from '@typed/fp/Effect/exports'
import { Eq, getTupleEq } from 'fp-ts/Eq'

import { useDepChange } from './useDepChange'
import { useRef } from './useRef'

/**
 * Memoize the result of a function.
 * @hook
 */
export const useMemo = <A, Deps extends ReadonlyArray<any>>(
  f: () => A,
  deps: Deps,
  eqs: EqsOf<Deps> = (deps.map(() => deepEqualsEq) as unknown) as EqsOf<Deps>,
) => {
  const eff = doEffect(function* () {
    const changed = yield* useDepChange(deps, getTupleEq(...eqs) as Eq<Deps>, false)
    const ref = yield* useRef(Pure.fromIO(f))

    if (changed) {
      ref.current = f()
    }

    return ref.current
  })

  return eff
}

export type EqsOf<A extends ReadonlyArray<any>> = {
  [K in keyof A]: Eq<A[K]>
}
