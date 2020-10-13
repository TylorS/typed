import { undisposable } from '@typed/fp/Disposable/exports'
import { doEffect } from '@typed/fp/Effect/exports'
import {
  getAllDescendants,
  isRunningHookEnvironmentEvent,
  listenToHookEvents,
} from '@typed/fp/hooks/core/exports'
import { readSharedRef } from '@typed/fp/SharedRef/exports'

import { RenderQueue } from './sharedRefs/exports'
import { UpdatedEnvs } from './sharedRefs/UpdatedEnvs'

export const respondToRunningEvents = doEffect(function* () {
  const updated = yield* readSharedRef(UpdatedEnvs)
  const queue = yield* readSharedRef(RenderQueue)

  yield* listenToHookEvents(
    isRunningHookEnvironmentEvent,
    undisposable(({ hookEnvironment }) => {
      const ids = new Set([hookEnvironment.id])

      updated.delete(hookEnvironment.id)

      for (const { id } of getAllDescendants(hookEnvironment)) {
        updated.delete(id)

        ids.add(id)
      }

      queue.remove(({ id }) => ids.has(id))
    }),
  )
})
