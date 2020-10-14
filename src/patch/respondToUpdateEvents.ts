import { undisposable } from '@typed/fp/Disposable/exports'
import { doEffect } from '@typed/fp/Effect/exports'
import { isUpdatedHookEnvironmentEvent, listenToHookEvents } from '@typed/fp/hooks/core/exports'
import { readSharedRef } from '@typed/fp/SharedRef/exports'

import { RenderQueue } from './sharedRefs/exports'
import { UpdatedEnvs } from './sharedRefs/UpdatedEnvs'

export const respondToUpdateEvents = doEffect(function* () {
  const updated = yield* readSharedRef(UpdatedEnvs)
  const renderQueue = yield* readSharedRef(RenderQueue)

  yield* listenToHookEvents(
    isUpdatedHookEnvironmentEvent,
    undisposable(({ hookEnvironment }) => {
      if (updated.has(hookEnvironment.id)) {
        return
      }

      updated.add(hookEnvironment.id)
      renderQueue.enqueue(hookEnvironment)
    }),
  )
})
