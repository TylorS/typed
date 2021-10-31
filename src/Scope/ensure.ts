import { isSome, none, Option, some } from 'fp-ts/Option'

import { Finalizer, FinalizerKey, Scope } from './Scope'

export function ensure(finalizer: Finalizer) {
  return <R, A>(scope: Scope<R, A>): Option<FinalizerKey> => {
    if (scope.type === 'Global' || isSome(scope.exit.get()) || scope.finalizing.get()) {
      return none
    }

    const finalizerKey = Symbol(`FinalizerKey`)

    scope.finalizers.set(finalizerKey, finalizer)

    return some(finalizerKey)
  }
}
