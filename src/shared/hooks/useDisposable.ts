import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@typed/fp/Disposable/exports'
import { doEffect, Pure } from '@typed/fp/Effect/exports'

import { Ref } from '../Ref'
import { defaultEqs, EqsOf, tupleEqOf } from './EqsOf'
import { addDisposable } from './NamespaceDisposables'
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
