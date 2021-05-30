import { fromIO } from '@fp/Env'
import { DoF, Fiber, getCurrentFiber } from '@fp/Fiber'
import { Ref, References, RefEvent } from '@fp/Ref'
import { Disposable, Time } from '@most/types'

import { useSink } from './useSink'
import { useStream } from './useStream'

export function useReplicateRefEvents<E, A>(provider: Fiber<unknown>, ref: Ref<E, A>) {
  return DoF(function* (_) {
    const current = yield* _(getCurrentFiber)
    const sink = yield* _(useSink(onEvent(current.refs, ref, () => disposable)))
    const disposable: Disposable = yield* _(useStream(provider.refs.events, sink))

    return disposable
  })
}

const onEvent =
  <E, A>(refs: References, ref: Ref<E, A>, f: () => Disposable) =>
  (_: Time, event: RefEvent<unknown>) =>
    fromIO(() => {
      if (event.id === ref.id) {
        refs.sendEvent(event)

        // Stop listening if the parent reference is deleted
        if (event.type === 'deleted') {
          f().dispose()
        }
      }
    })
