import { ask, doEffect, Effect } from '@typed/fp/Effect'
import { Uuid } from '@typed/fp/Uuid'
import { pipe } from 'fp-ts/es6/function'
import { isNone } from 'fp-ts/es6/Option'

import { createRef, Ref } from '../Ref'
import { getNextIndex, lookupByIndex } from './helpers'
import { HookEnv, HookEnvironment } from './HookEnvironment'

export function createUseRefByIndex(hookPositions: Map<Uuid, number>) {
  const useRefByIndex = <E, A>(initialValue: Effect<E, A>): Effect<HookEnv & E, Ref<A>> =>
    doEffect(function* () {
      const { hookEnvironment } = yield* ask<HookEnv>()
      const index = getNextIndex(hookPositions, hookEnvironment.id)
      const state = pipe(hookEnvironment.states, lookupByIndex(index))

      if (isNone(state)) {
        return yield* setRefByIndex(hookEnvironment, index, initialValue)
      }

      return state.value as Ref<A>
    })

  return useRefByIndex
}

function setRefByIndex<E, A>(
  hookEnvironment: HookEnvironment,
  index: number,
  initialValue: Effect<E, A>,
): Effect<E, Ref<A>> {
  return doEffect(function* () {
    const ref = createRef(yield* initialValue)

    hookEnvironment.states.set(index, ref)

    return ref
  })
}
