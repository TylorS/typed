import { Eq } from 'fp-ts/es6/Eq'
import { isNone, none, Option, some } from 'fp-ts/es6/Option'

import { doEffect, Effect } from '../Effect'
import { useRef } from './useRef'

export function useHasChanged<A extends ReadonlyArray<any>>(value: A, initial = true, eq: Eq<A>) {
  const getRef = useRef(Effect.of<Option<A>>(none))

  return doEffect(function* () {
    const ref = yield* getRef
    const currentValue = ref.read()

    if (isNone(currentValue)) {
      ref.write(some(value))()

      return initial
    }

    const changed = !eq.equals(value, currentValue.value)

    if (changed) {
      ref.write(some(value))()
    }

    return changed
  })
}
