import { isNone } from 'fp-ts/Option'

import { Fx, Of } from '@/Fx'
import { decrementAndGet } from '@/MutableRef'

import { Scope } from './Scope'

export function release<R, A>(scope: Scope<R, A>): Of<boolean> {
  return Fx(function* () {
    if (scope.type === 'Global') {
      return false
    }

    const optionExit = scope.exit.get()

    if (isNone(optionExit) || decrementAndGet(scope.refCount) > 0) {
      return false
    }

    const exit = optionExit.value

    scope.finalizing.set(true)

    if (scope.finalizers.size > 0) {
      for (const finalizer of scope.finalizers.values()) {
        yield* finalizer(exit)
      }
    }

    scope.finalizing.set(false)
    scope.finalized.set(true)

    const observers = scope.observers.get()

    scope.observers.set([])

    observers.forEach((o) => o(exit))

    return true
  })
}
