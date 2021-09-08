import { pipe } from 'fp-ts/function'

import { Fx } from '@/Fx'

import type { AtomicReference } from './AtomicReference'
import { compareAndSwap } from './compareAndSwap'

export function modify<A, R, E, B>(f: (value: A) => Fx<R, E, readonly [B, A]>) {
  return (ref: AtomicReference<A>): Fx<R, E, readonly [B, A]> => {
    return Fx(function* () {
      let shouldContinue = true
      let result: readonly [any, A]

      while (shouldContinue) {
        const old = ref.get

        result = yield* f(old)
        shouldContinue = pipe(ref, compareAndSwap(old, result[1]))
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return result!
    })
  }
}
