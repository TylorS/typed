import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import * as C from '@/Cause'
import { FiberId } from '@/Fiber'

export type Exit<E, A> = E.Either<C.Cause<E>, A>

export const match =
  <A, B, C, D, E, F, G, H, I>(
    onEmpty: () => A,
    onDied: (error: unknown) => B,
    onInterrupted: (fiberId: FiberId) => C,
    onExpected: (error: D) => E,
    onThen: (left: C.Cause<D>, right: C.Cause<D>) => F,
    onBoth: (left: C.Cause<D>, right: C.Cause<D>) => G,
    onSuccess: (value: H) => I,
  ) =>
  (exit: Exit<D, H>): A | B | C | E | F | G | I =>
    pipe(
      exit,
      E.matchW(C.match(onEmpty, onDied, onInterrupted, onExpected, onThen, onBoth), onSuccess),
    )

export const flatten = <E, E2, A>(exit: Exit<E, Exit<E2, A>>): Exit<E | E2, A> =>
  pipe(exit, E.flattenW)
