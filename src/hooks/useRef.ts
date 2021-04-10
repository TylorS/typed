import { Env, map } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef } from '@fp/Ref'
import { pipe } from 'cjs/function'
import { contramap, Eq } from 'fp-ts/Eq'

import { getNextSymbol } from './internal/getNextSymbol'

export interface MutableRef<A> {
  current: A
}

export function useRef<E, A>(initial: Env<E, A>, eq: Eq<A> = alwaysEqualsEq) {
  return Do(function* (_) {
    const symbol = yield* _(getNextSymbol)
    const ref = createRef(
      pipe(
        initial,
        map((a): MutableRef<A> => ({ current: a })),
      ),
      symbol,
      pipe(
        eq,
        contramap((r) => r.current),
      ),
    )

    return yield* _(getRef(ref))
  })
}
