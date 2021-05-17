import { Env } from '@fp/Env'
import { Fiber, getCurrentFiber } from '@fp/Fiber'
import { Do } from '@fp/Fx/Env'
import { Ref } from '@fp/Ref'

import { findProvider } from './findProvider'
import { useStream } from './useStream'

export function withProvider<E1, A, E2, B>(
  ref: Ref<E1, A>,
  f: (provider: Fiber<unknown>) => Env<E2, B>,
) {
  return Do(function* (_) {
    const provider = yield* _(findProvider(ref))
    const current = yield* _(getCurrentFiber)

    // Replicate reference changes to current fiber
    yield* _(
      useStream(provider.refs.events, {
        event: (_, event) => {
          if (event.type === 'updated' || (event.type === 'deleted' && event.id === ref.id)) {
            current.refs.sendEvent(event)
          }
        },
      }),
    )

    const b = yield* _(f(provider))

    return b
  })
}
