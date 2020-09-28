import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'
import { Iso } from 'monocle-ts'

import { CurrentState, imap } from './CurrentState'

/**
 * Apply an Iso to a set of state
 */
export const applyIso = curry(
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...CurrentState<A>, ...B],
    iso: Iso<A, C>,
  ): readonly [...CurrentState<C>, ...B] => pipe(state, imap(iso.get, iso.reverseGet)),
) as {
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...CurrentState<A>, ...B],
    iso: Iso<A, C>,
  ): readonly [...CurrentState<C>, ...B]

  <A, B extends ReadonlyArray<any>>(state: readonly [...CurrentState<A>, ...B]): <C>(
    iso: Iso<A, C>,
  ) => readonly [...CurrentState<C>, ...B]
}
