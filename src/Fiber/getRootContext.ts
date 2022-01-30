import { pipe } from 'fp-ts/function'
import { isSome } from 'fp-ts/Option'

import { withinContext } from '@/Effect'
import { Fx, getContext } from '@/Fx'

export const getRootContext = <E>() =>
  Fx(function* () {
    let context = yield* getContext<E>('getRootContext')

    while (isSome(context.parent)) {
      context = context.parent.value
    }

    return context
  })

export const withinRootContext = <R, E, A>(fx: Fx<R, E, A>) =>
  Fx(function* () {
    const context = yield* getRootContext<E>()

    return yield* pipe(fx, withinContext(context))
  })
