import { Arity1 } from '@typed/fp/common/exports'
import { curry } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'
import { flow, identity, pipe } from 'fp-ts/function'
import { IO, map as mapIo } from 'fp-ts/IO'

export type State<A, B = A> = readonly [IO<A>, Arity1<B, A>]

/**
 * Get the current state.
 */
export const getState = <A, B>(state: State<A, B>): A => state[0]()

/**
 * Set the current state.
 */
export const setState = curry(<A, B>(value: A, state: State<B, A>): B => state[1](value)) as {
  <A, B>(value: A, state: State<B, A>): B
  <A>(value: A): <B>(state: State<B, A>) => B
}

/**
 * Perform and update with the current piece of state
 */
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

/**
 * Change the right hand value of a piece of state.
 */
export const contramap = curry(
  <A, B, C>(f: (a: A) => B, state: State<C, B>): State<C, A> => pipe(state, promap(identity, f)),
) as {
  <A, B, C>(f: (a: A) => B, state: State<C, B>): State<C, A>
  <A, B>(f: (a: A) => B): <C>(state: State<C, B>) => State<C, A>
}

/**
 * Change the left and right side values of state. Helpful for
 * focusing in on a individual piece of state.
 *
 */
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

export type StateOptions<A> = {
  readonly initial: A
  readonly eq: Eq<A>
  readonly onValue: (previous: A, current: A) => void
}

/**
 * Create and listen to state changes
 */
export function createState<A>(options: StateOptions<A>): State<A> {
  let current = options.initial

  const state: State<A> = [
    () => current,
    (updated) => {
      if (!options.eq.equals(current, updated)) {
        const previous = current

        current = updated

        options.onValue(previous, current)
      }

      return current
    },
  ]

  return state
}

/**
 * Apply a reducer to a piece of state.
 */
export const applyReducer = curry(
  <A, B, C>(reducer: (a: A, b: B) => C, state: State<A, C>): State<A, B> =>
    contramap((b) => reducer(getState(state), b), state),
) as {
  <A, B, C>(reducer: (a: A, b: B) => C, state: State<A, C>): State<A, B>
  <A, B, C>(reducer: (a: A, b: B) => C): (state: State<A, C>) => State<A, B>
}
