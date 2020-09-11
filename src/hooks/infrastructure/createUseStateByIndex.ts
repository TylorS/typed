import { deepEqualsEq } from '@typed/fp/common/exports'
import { ask, doEffect, Effect } from '@typed/fp/Effect/exports'
import { Uuid } from '@typed/fp/Uuid/exports'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { isNone } from 'fp-ts/Option'

import { GetAndUpdateState } from '../domain/exports'
import { createUseState } from './createUseState'
import { HookEvent, HookEventType, UpdatedHookEnvironment } from './events'
import { getNextIndex, lookupByIndex } from './helpers'
import { HookEnv } from './HookEnvironment'

export function createUseStateByIndex(
  hookPositions: Map<Uuid, number>,
  getReference: (index: number) => symbol,
  sendEvent: (event: HookEvent) => void,
) {
  return <E, A>(
    initialValue: Effect<E, A>,
    eq: Eq<A> = deepEqualsEq,
  ): Effect<HookEnv & E, GetAndUpdateState<A>> =>
    doEffect(function* () {
      const { hookEnvironment } = yield* ask<HookEnv>()
      const index = getNextIndex(hookPositions, hookEnvironment.id)
      const reference = getReference(index)
      const state = pipe(hookEnvironment.states, lookupByIndex(reference))

      if (isNone(state)) {
        return yield* createUseState({
          states: hookEnvironment.states,
          initialValue,
          key: reference,
          eq,
          sendEvent,
          createEvent: (): UpdatedHookEnvironment => ({
            type: HookEventType.UpdatedEnvironment,
            hookEnvironment,
          }),
        })
      }

      return state.value
    })
}
