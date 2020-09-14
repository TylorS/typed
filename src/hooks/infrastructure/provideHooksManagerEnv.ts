import { doEffect, provideWith } from '@typed/fp/Effect/exports'
import { createUuid } from '@typed/fp/Uuid/exports'
import { create } from 'most-subject'

import { createHookEnvironment } from './HookEnvironment'
import { HooksManagerEnv } from './HooksManagerEnv'

export const provideHooksManagerEnv = provideWith(
  doEffect(function* () {
    const id = yield* createUuid
    const hookEnvironment = createHookEnvironment(id)
    const hookEnv: HooksManagerEnv = {
      hookEnvironment,
      hookEvents: create(),
      hookPositions: new Map(),
      channelConsumers: new Map(),
      channelProviders: new Map(),
      disposables: new Map(),
    }

    return hookEnv
  }),
)
