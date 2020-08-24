import { doEffect, Effect, provide } from '@typed/fp/Effect'
import { Uuid } from '@typed/fp/Uuid'
import { pipe } from 'fp-ts/es6/function'

import { HookEnv, HookEnvironment, HookEvent, HookEventType } from '../../domain'
import { INITIAL_ENV_INDEX } from './constants'

export function createRunWithHooks(
  hookPositions: Map<Uuid, number>,
  sendEvent: (event: HookEvent) => void,
) {
  return <E, A>(eff: Effect<E & HookEnv, A>, hookEnvironment: HookEnvironment): Effect<E, A> =>
    doEffect(function* () {
      sendEvent({
        type: HookEventType.UpdatedEnvironment,
        hookEnvironment,
        updated: false,
      })

      hookPositions.set(hookEnvironment.id, INITIAL_ENV_INDEX)

      const value = yield* pipe(eff, provide({ hookEnvironment })) as Effect<E, A>

      return value
    })
}
