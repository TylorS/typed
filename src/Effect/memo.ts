import { isSome, none, Option, some } from 'fp-ts/Option'

import { doEffect } from './doEffect'
import { Effect } from './Effect'

export const memo = <E, A>(effect: Effect<E, A>): Effect<E, A> => {
  let returnValue: Option<A> = none

  return doEffect(function* () {
    if (isSome(returnValue)) {
      return returnValue.value
    }

    const value = yield* effect

    returnValue = some(value)

    return value
  })
}
