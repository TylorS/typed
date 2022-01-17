import { getContext } from '@/Effect/GetContext'
import { Fx, of } from '@/Fx'

import { FiberRef } from './FiberRef'

export const set =
  <A>(value: A) =>
  <R, E>(fiberRef: FiberRef<R, E, A>) =>
    Fx(function* () {
      const context = yield* getContext<E>()

      return yield* context.locals.update(fiberRef, () => of(value))
    })
