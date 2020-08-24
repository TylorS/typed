import { ask, doEffect, Effect } from '@typed/fp/Effect'
import { Uuid } from '@typed/fp/Uuid'
import { Eq, eqStrict } from 'fp-ts/es6/Eq'
import { pipe } from 'fp-ts/es6/function'
import { isNone } from 'fp-ts/es6/Option'

import { UseState } from '../useState'
import { createUseState } from './createUseState'
import { HookEvent, HookEventType } from './events'
import { getNextIndex, lookupByIndex } from './helpers'
import { HookEnv } from './HookEnvironment'

export function createUseStateByIndex(
  hookPositions: Map<Uuid, number>,
  sendEvent: (event: HookEvent) => void,
) {
  return <E, A>(
    initialValue: Effect<E, A>,
    eq: Eq<A> = eqStrict,
  ): Effect<HookEnv & E, UseState<A>> =>
    doEffect(function* () {
      const { hookEnvironment } = yield* ask<HookEnv>()
      const index = getNextIndex(hookPositions, hookEnvironment.id)
      const state = pipe(hookEnvironment.states, lookupByIndex(index))

      if (isNone(state)) {
        return yield* createUseState({
          states: hookEnvironment.states,
          initialValue,
          key: index,
          eq,
          sendEvent,
          createEvent: () => ({
            type: HookEventType.UpdatedEnvironment,
            hookEnvironment,
            updated: true,
          }),
        })
      }

      return state.value
    })
}
