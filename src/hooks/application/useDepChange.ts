import { doEffect, Pure } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { useRef } from '../domain/exports'

const pureTrue = Pure.of(true)

export const useDepChange = <A>(dep: A, eq: Eq<A>, firstRun = true) => {
  const eff = doEffect(function* () {
    const firstRunRef = yield* useRef(pureTrue)
    const depRef = yield* useRef(Pure.of(dep))

    if (firstRunRef.current) {
      firstRunRef.current = false

      return firstRun
    }

    const changed = !eq.equals(depRef.current, dep)

    if (changed) {
      depRef.current = dep
    }

    return changed
  })

  return eff
}
