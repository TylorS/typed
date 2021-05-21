import { DoF, Fiber, getCurrentFiber } from '@fp/Fiber'
import { Ref } from '@fp/Ref'

import { useStream } from './useStream'

export function useReplicateRefEvents<E, A>(provider: Fiber<unknown>, ref: Ref<E, A>) {
  return DoF(function* (_) {
    const current = yield* _(getCurrentFiber)

    // Replicate reference changes to current fiber
    const disposable = yield* _(
      useStream(provider.refs.events, {
        event: (_, event) => {
          if (event.id === ref.id) {
            current.refs.sendEvent(event)

            // Stop listening if the parent reference is deleted
            if (event.type === 'deleted') {
              disposable.dispose()
            }
          }
        },
      }),
    )

    return disposable
  })
}
