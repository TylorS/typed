import { Some } from '@/Prelude/Some'

import { LocalScope } from './LocalScope'
import { Scope } from './Scope'

export const extendScope = <E, A, E2 = E, B = A>(parentScope: Scope<E, A>) => {
  const local = new LocalScope<E2, B>(Some(parentScope))

  if (!local.extend(parentScope)) {
    const err = new Error('Unable to extend parent scope')

    if (Error.captureStackTrace) {
      Error.captureStackTrace(err, extendScope)
    }

    console.warn(err)
  }

  return local
}
