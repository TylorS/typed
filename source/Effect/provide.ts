import { curry } from '@typed/fp/lambda'
import { Effect, PureEffect } from './Effect'

const provideUncurried = <P, E, A>(provided: P, eff: Effect<E & P, A>): Provided<E, A, P> =>
  ((e: E) => eff({ ...provided, ...e })) as Provided<E, A, P>

export type Provided<E, A, P> = P extends E ? PureEffect<A> : Effect<E, A>

export const provide = curry(provideUncurried) as {
  <P, E, A>(provided: P, eff: Effect<E & P, A>): Provided<E, A, P>
  <P>(provided: P): <E, A>(eff: Effect<E & P, A>) => Provided<E, A, P>
}
