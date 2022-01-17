import { getContext } from '@/Effect/GetContext'
import { Fx } from '@/Fx'

import { FiberRef } from './FiberRef'

export const values = <R, E, A>(fiberRef: FiberRef<R, E, A>) =>
  Fx(function* () {
    const context = yield* getContext<E>()

    return yield* context.locals.delete(fiberRef)
  })
