import { doEffect } from '@typed/fp/Effect'
import { provideWith } from '@typed/fp/Effect/provideWith'
import { createUuid } from '@typed/fp/Uuid'
import { create } from 'most-subject'

import { createHookEnvironment } from '../domain'
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
    }

    return hookEnv
  }),
)
