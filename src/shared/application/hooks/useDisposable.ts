import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@typed/fp/Disposable/exports'
import { doEffect, Pure } from '@typed/fp/Effect/exports'
import { defaultEqs, EqsOf, tupleEqOf } from '@typed/fp/Shared/common/EqsOf'

import { Ref } from '../model/exports'
import { addDisposable } from '../services/exports'
import { useDepChange } from './useDepChange'
import { useRef } from './useRef'

export const useDisposable = <Deps extends ReadonlyArray<any>>(
  f: () => Disposable,
  deps: Deps,
  eqs: EqsOf<Deps> = defaultEqs(deps),
) => {
  const eff = doEffect(function* () {
    const depsChanged = yield* useDepChange(deps, tupleEqOf(eqs), true)
    const ref: Ref<Disposable> = yield* useRef(Pure.fromIO(disposeNone))

    if (depsChanged) {
      ref.current.dispose()

      const disposable = f()

      ref.current = disposeAll([disposable, yield* addDisposable(disposable)])
    }

    return ref.current
  })

  return eff
}
