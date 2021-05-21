import { Env } from '@fp/Env'
import { DoF, Fiber } from '@fp/Fiber'
import { Ref } from '@fp/Ref'

import { findProvider } from './findProvider'

export function withProvider<E1, A, E2, B>(
  ref: Ref<E1, A>,
  f: (provider: Fiber<unknown>) => Env<E2, B>,
) {
  return DoF(function* (_) {
    const provider = yield* _(findProvider(ref))

    return yield* _(f(provider))
  })
}
