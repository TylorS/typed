import { withinContext } from '@/Effect'
import { FiberContext } from '@/FiberContext'
import { pipe } from '@/function'
import { Fx } from '@/Fx'

import { FiberRef } from './FiberRef'
import { findProvider } from './findProvider'

export function withProvider<R, E, A>(ref: FiberRef<R, E, A>) {
  return <R2, E2, B>(fx: Fx<R2, E2, B>): Fx<R2, E | E2, B> =>
    Fx(function* () {
      const provider = (yield* findProvider(ref)) as FiberContext<E | E2>

      return yield* pipe(fx, withinContext(provider))
    })
}
