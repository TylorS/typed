import { fromIO, getScope } from '@/Effect'
import { isLeft } from '@/Prelude/Either'
import { isSome } from '@/Prelude/Option'

import { Fx } from './Fx'

export const uninterruptable = <R, E, A>(fx: Fx<R, E, A>) =>
  Fx(function* () {
    const scope = yield* getScope<E>()

    const key = scope.ensure((exit) =>
      fromIO(() => {
        if (isLeft(exit)) {
          scope.interruptableStatus.isInterruptable = true
        }
      }),
    )

    scope.interruptableStatus.isInterruptable = false

    const a = yield* fx

    scope.interruptableStatus.isInterruptable = true

    if (isSome(key)) {
      scope.cancel(key.value)
    }

    return a
  })
