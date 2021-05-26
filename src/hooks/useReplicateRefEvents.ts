import { fromIO } from '@fp/Env'
import { DoF, Fiber, getCurrentFiber } from '@fp/Fiber'
import { Ref, References, RefEvent } from '@fp/Ref'
import { Disposable } from '@most/types'

import { useMemo } from './useMemo'
import { useSink, withEvent } from './useSink'
import { useStream } from './useStream'

export function useReplicateRefEvents<E, A>(provider: Fiber<unknown>, ref: Ref<E, A>) {
  return DoF(function* (_) {
    const current = yield* _(getCurrentFiber)
    const event = yield* _(
      useMemo(
        fromIO(() => onEvent(current.refs, ref, () => disposable)),
        [current.refs, ref.id],
      ),
    )
    const sink = yield* _(useSink(event))
    const disposable: Disposable = yield* _(useStream(provider.refs.events, sink))

    return disposable
  })
}

const onEvent = <E, A>(refs: References, ref: Ref<E, A>, f: () => Disposable) =>
  withEvent((event: RefEvent<unknown>) =>
    fromIO(() => {
      if (event.id === ref.id) {
        refs.sendEvent(event)

        // Stop listening if the parent reference is deleted
        if (event.type === 'deleted') {
          f().dispose()
        }
      }
    }),
  )
