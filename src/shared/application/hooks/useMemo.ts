import { doEffect, Pure } from '@typed/fp/Effect/exports'
import { defaultEqs, EqsOf, tupleEqOf } from '@typed/fp/Shared/common/EqsOf'

import { useDepChange } from './useDepChange'
import { useRef } from './useRef'

/**
 * Memoize the result of a function.
 * @hook
 */
export const useMemo = <A, Deps extends ReadonlyArray<any>>(
  f: () => A,
  deps: Deps,
  eqs: EqsOf<Deps> = defaultEqs(deps),
) => {
  const eff = doEffect(function* () {
    const changed = yield* useDepChange(deps, tupleEqOf(eqs), false)
    const ref = yield* useRef(Pure.fromIO(f))

    if (changed) {
      ref.current = f()
    }

    return ref.current
  })

  return eff
}
