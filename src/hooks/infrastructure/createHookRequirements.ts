import { ask, doEffect } from '@typed/fp/Effect/exports'
import { createUuid } from '@typed/fp/Uuid/exports'
import { some } from 'fp-ts/es6/Option'

import { hookRequirementsIso } from '../domain/exports'
import { createHookEnvironment, HookEnv } from './HookEnvironment'

export const createHookRequirements = doEffect(function* () {
  const { hookEnvironment } = yield* ask<HookEnv>()
  const id = yield* createUuid
  const requirements = hookRequirementsIso.wrap(createHookEnvironment(id, some(hookEnvironment)))

  return requirements
})
