import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { fromEffect } from '../constructor/fromEffect.js'

import { flatMap } from './flatMap.js'
import { flatMapConcurrently } from './flatMapConcurrently.js'

export function tap<A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> =>
    pipe(
      fx,
      flatMap((a) => pipe(a, f, Effect.as(a), fromEffect)),
    )
}

export function tapConcurrently<A, R2, E2, B>(
  concurrency: number,
  f: (a: A) => Effect.Effect<R2, E2, B>,
) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> =>
    pipe(
      fx,
      flatMapConcurrently(concurrency, (a) => pipe(a, f, Effect.as(a), fromEffect)),
    )
}

export function tapSeq<A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> => pipe(fx, tapConcurrently(1, f))
}
