import { Arity1 } from '@typed/fp/common/exports'
import { curry } from '@typed/fp/lambda/exports'
import { flow, identity, pipe } from 'fp-ts/function'
import { IO, map as mapIo } from 'fp-ts/IO'

export type State<A, B> = readonly [IO<A>, Arity1<B, A>]

export const getState = <A, B>(state: State<A, B>): A => state[0]()

export const setState = curry(<A, B>(value: A, state: State<B, A>): B => state[1](value)) as {
  <A, B>(value: A, state: State<B, A>): B
  <A>(value: A): <B>(state: State<B, A>) => B
}

export const updateState = curry(
  <A, B>(f: (value: A) => B, state: State<A, B>): A => {
    const a = getState(state)
    const b = f(a)

    return setState(b, state)
  },
) as {
  <A, B>(f: (value: A) => B, state: State<A, B>): A
  <A, B>(f: (value: A) => B): (state: State<A, B>) => A
}

export const contramap = curry(
  <A, B, C>(f: (a: A) => B, state: State<C, B>): State<C, A> => pipe(state, promap(identity, f)),
) as {
  <A, B, C>(f: (a: A) => B, state: State<C, B>): State<C, A>
  <A, B>(f: (a: A) => B): <C>(state: State<C, B>) => State<C, A>
}

export const promap = curry(
  <A, B, C, D>(f: (a: A) => B, g: (d: D) => C, [getA, sendC]: State<A, C>): State<B, D> => [
    pipe(getA, mapIo(f)),
    flow(g, sendC, f),
  ],
) as {
  <A, B, C, D>(f: (a: A) => B, g: (d: D) => C, state: State<A, C>): State<B, D>
  <A, B, C, D>(f: (a: A) => B, g: (d: D) => C): (state: State<A, C>) => State<B, D>

  <A, B>(f: (a: A) => B): {
    <C, D>(g: (d: D) => C, state: State<A, C>): State<B, D>
    <C, D>(g: (d: D) => C): (state: State<A, C>) => State<B, D>
  }
}
