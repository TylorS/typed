import { ask, doEffect } from '@typed/fp/Effect'
import { createUuid } from '@typed/fp/Uuid'
import { some } from 'fp-ts/lib/Option'

import { hookRequirementsIso } from '../domain'
import { createHookEnvironment, HookEnv } from './HookEnvironment'

export const createHookRequirements = doEffect(function* () {
  const { hookEnvironment } = yield* ask<HookEnv>()
  const id = yield* createUuid
  const requirements = hookRequirementsIso.wrap(createHookEnvironment(id, some(hookEnvironment)))

  return requirements
})
