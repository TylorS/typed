import { ask, doEffect } from '@typed/fp/Effect'
import { createUuid } from '@typed/fp/Uuid'
import { some } from 'fp-ts/es6/Option'

import { createHookEnvironment, HookEnv, HookEvent, HookEventType } from '../../domain'

export function createGetKeyedEnv(sendEvent: (event: HookEvent) => void) {
  return (key: any) =>
    doEffect(function* () {
      const { hookEnvironment } = yield* ask<HookEnv>()

      if (!hookEnvironment.children.has(key)) {
        const id = yield* createUuid
        const keyed = createHookEnvironment(id, some(hookEnvironment))

        sendEvent({ type: HookEventType.CreatedEnvironment, hookEnvironment: keyed })

        hookEnvironment.children.set(key, keyed)
      }

      return hookEnvironment.children.get(key)!
    })
}
