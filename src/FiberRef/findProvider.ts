import { getContext } from '@/Effect'
import { Fx } from '@/Fx'
import { isSome } from '@/Prelude/Option'

import { FiberRef } from './FiberRef'

/**
 * Traverse up the FiberContext tree and find the closest ancestor which contains the Ref
 * we are looking for. If none is found, the root-most FiberContext will be utilized.
 */
export const findProvider = <R, E, A>(fiberRef: FiberRef<R, E, A>) =>
  Fx(function* () {
    let context = yield* getContext<E>()

    while (!(yield* context.locals.has(fiberRef)) && isSome(context.parent)) {
      context = context.parent.value
    }

    return context
  })
