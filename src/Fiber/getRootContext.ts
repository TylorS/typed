import { pipe } from 'fp-ts/function'
import { isSome } from 'fp-ts/Option'

import { withinContext } from '@/Effect'
import { Fx, getContext } from '@/Fx'

export const getRootContext = Fx(function* () {
  let context = yield* getContext<any>('getRootContext')

  while (isSome(context.parent)) {
    context = context.parent.value
  }

  return context
})

export const withinRootContext = <R, E, A>(fx: Fx<R, E, A>) =>
  Fx(function* () {
    const context = yield* getRootContext

    return yield* pipe(fx, withinContext(context))
  })
