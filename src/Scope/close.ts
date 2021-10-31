import { isSome, some } from 'fp-ts/Option'

import { Exit } from '@/Exit'
import { fromValue } from '@/Fiber/Instruction'
import { Of } from '@/Fx'

import { release } from './release'
import { Scope } from './Scope'

export function close<A>(exit: Exit<A>) {
  return <R>(scope: Scope<R, A>): Of<boolean> => {
    if (scope.type === 'Global' || isSome(scope.exit.get())) {
      return fromValue(false)
    }

    scope.exit.set(some(exit))

    return release(scope)
  }
}
