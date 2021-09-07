import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import type { AtomicReference } from './AtomicReference'
import { compareAndSwap } from './compareAndSwap'

export function modify<A>(
  Eq: Eq<A>,
): <B>(f: (value: A) => readonly [B, A]) => (ref: AtomicReference<A>) => readonly [B, A] {
  const cas = compareAndSwap(Eq)

  return (f) => (ref) => {
    let shouldContinue = true
    let result: readonly [any, A]

    while (shouldContinue) {
      const old = ref.get

      result = f(old)
      shouldContinue = pipe(ref, cas(old, result[1]))
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return result!
  }
}
