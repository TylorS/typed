import { doEffect, Effect, provide } from '@typed/fp/Effect'
import { Uuid } from '@typed/fp/Uuid'
import { pipe } from 'fp-ts/es6/function'

import { HookEvent, HookEventType } from '../events'
import { HookEnv, HookEnvironment } from '../HookEnvironment'
import { HookRequirements, hookRequirementsIso } from '../runWithHooks'
import { INITIAL_ENV_INDEX } from './constants'

export function createRunWithHooks(
  hookPositions: Map<Uuid, number>,
  sendEvent: (event: HookEvent) => void,
) {
  return <E, A>(eff: Effect<E & HookEnv, A>, hookRequirements: HookRequirements): Effect<E, A> =>
    doEffect(function* () {
      const hookEnvironment = hookRequirementsIso.unwrap(hookRequirements) as HookEnvironment

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
