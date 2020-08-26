import { deepEqualsEq } from '@typed/fp/common'
import { ask, doEffect, Effect } from '@typed/fp/Effect'
import { Uuid } from '@typed/fp/Uuid'
import { Eq } from 'fp-ts/es6/Eq'
import { pipe } from 'fp-ts/es6/function'
import { isNone } from 'fp-ts/es6/Option'

import { GetAndUpdateState } from '../domain'
import { createUseState } from './createUseState'
import { HookEvent, HookEventType, UpdatedHookEnvironment } from './events'
import { getNextIndex, lookupByIndex } from './helpers'
import { HookEnv } from './HookEnvironment'

export function createUseStateByIndex(
  hookPositions: Map<Uuid, number>,
  sendEvent: (event: HookEvent) => void,
) {
  return <E, A>(
    initialValue: Effect<E, A>,
    eq: Eq<A> = deepEqualsEq,
  ): Effect<HookEnv & E, GetAndUpdateState<A>> =>
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
          createEvent: (value): UpdatedHookEnvironment => ({
            type: HookEventType.UpdatedEnvironment,
            hookEnvironment,
            key: index,
            value,
          }),
        })
      }

      return state.value
    })
}
