import { Arity1 } from '@typed/fp/common/exports'
import { doEffect, map as mapEff, Pure } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { flow, identity, pipe } from 'fp-ts/function'

export type State<A, B> = readonly [Pure<A>, Arity1<B, Pure<A>>]

export const getState = <A, B>(state: State<A, B>): Pure<A> => state[0]

export const setState = curry(<A, B>(value: A, state: State<B, A>): Pure<B> => state[1](value)) as {
  <A, B>(value: A, state: State<B, A>): Pure<B>
  <A>(value: A): <B>(state: State<B, A>) => Pure<B>
}

export const updateState = <A, B>(f: (value: A) => B, state: State<A, B>): Pure<A> =>
  doEffect(function* () {
    const a = yield* getState(state)
    const b = f(a)

    return yield* setState(b, state)
  })

export const contramap = curry(
  <A, B, C>(f: (a: A) => B, state: State<C, B>): State<C, A> => pipe(state, promap(identity, f)),
) as {
  <A, B, C>(f: (a: A) => B, state: State<C, B>): State<C, A>
  <A, B>(f: (a: A) => B): <C>(state: State<C, B>) => State<C, A>
}

export const promap = curry(
  <A, B, C, D>(f: (a: A) => B, g: (d: D) => C, [getA, sendB]: State<A, C>): State<B, D> => [
    mapEff(f, getA),
    flow(g, sendB, mapEff(f)),
  ],
) as {
  <A, B, C, D>(f: (a: A) => B, g: (d: D) => C, state: State<A, C>): State<B, D>
  <A, B, C, D>(f: (a: A) => B, g: (d: D) => C): (state: State<A, C>) => State<B, D>

  <A, B>(f: (a: A) => B): {
    <C, D>(g: (d: D) => C, state: State<A, C>): State<B, D>
    <C, D>(g: (d: D) => C): (state: State<A, C>) => State<B, D>
  }
}
