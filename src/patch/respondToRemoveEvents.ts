import { undisposable } from '@typed/fp/Disposable/exports'
import { doEffect } from '@typed/fp/Effect/exports'
import { isRemovedHookEnvironmentEvent, listenToHookEvents } from '@typed/fp/hooks/core/exports'

import { readPatchRefs } from './sharedRefs/readPatchRefs'

export const respondToRemoveEvents = doEffect(function* () {
  const { renderables, renderers, rendered, updated, updating } = yield* readPatchRefs

  yield* listenToHookEvents(
    isRemovedHookEnvironmentEvent,
    undisposable(({ hookEnvironment }) => {
      const { id } = hookEnvironment

      renderables.delete(id)
      renderers.delete(id)
      rendered.delete(id)
      updated.delete(id)
      updating.delete(id)
    }),
  )
})
