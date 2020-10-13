import { undisposable } from '@typed/fp/Disposable/exports'
import { doEffect } from '@typed/fp/Effect/exports'
import {
  HookEnvironment,
  isUpdatedHookEnvironmentEvent,
  listenToHookEvents,
} from '@typed/fp/hooks/core/exports'
import { readSharedRef } from '@typed/fp/SharedRef/exports'
import { isSome } from 'fp-ts/Option'

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

      for (const id of getAllAncestorIds(hookEnvironment)) {
        // Bail out if it'd be faster to update a parent
        if (updated.has(id)) {
          return
        }
      }

      updated.add(hookEnvironment.id)
      renderQueue.enqueue(hookEnvironment)
    }),
  )
})

function* getAllAncestorIds(env: HookEnvironment) {
  let parent = env.parent

  while (isSome(parent)) {
    const node = parent.value

    yield node.id

    parent = node.parent
  }
}
