import { pipe } from 'fp-ts/function'
import { isNone, isSome } from 'fp-ts/Option'

import { fromIO } from '@/Fiber/Instruction'
import { incrementAndGet } from '@/MutableRef'

import { ensure } from './ensure'
import { release } from './release'
import { Scope } from './Scope'

export function extend<R2, B>(childScope: Scope<R2, B>) {
  return <R, A>(parentScope: Scope<R, A>): boolean => {
    if (parentScope === childScope || childScope.type === 'Global') {
      return true
    }

    const isOpen = isNone(childScope.exit.get())
    const canEnsureRelease = pipe(
      parentScope,
      ensure(() => release(childScope)),
      isSome,
    )

    if (isOpen && canEnsureRelease) {
      // Add reference
      incrementAndGet(childScope.refCount)

      // If opening a daemon process in the global scope track this Scope
      if (parentScope.type === 'Global') {
        parentScope.children.add(childScope)

        pipe(
          childScope,
          ensure(() => fromIO(() => parentScope.children.delete(childScope))),
        )
      }

      return true
    }

    return false
  }
}
