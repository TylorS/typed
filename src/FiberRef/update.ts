import { getContext } from '@/Effect/GetContext'
import { Fx } from '@/Fx'

import { FiberRef } from './FiberRef'

export const update =
  <A, R2, E2>(f: (value: A) => Fx<R2, E2, A>) =>
  <R, E>(fiberRef: FiberRef<R, E, A>) =>
    Fx(function* () {
      const context = yield* getContext<E>()

      return yield* context.locals.update(fiberRef, f)
    })
