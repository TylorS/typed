import { imap, UseState } from '@typed/fp/hooks/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'
import { Iso } from 'monocle-ts'

/**
 * Apply an Iso to a set of state
 */
export const applyIso = curry(
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...UseState<A>, ...B],
    iso: Iso<A, C>,
  ): readonly [...UseState<C>, ...B] => pipe(state, imap(iso.get, iso.reverseGet)),
) as {
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...UseState<A>, ...B],
    iso: Iso<A, C>,
  ): readonly [...UseState<C>, ...B]

  <A, B extends ReadonlyArray<any>>(state: readonly [...UseState<A>, ...B]): <C>(
    iso: Iso<A, C>,
  ) => readonly [...UseState<C>, ...B]
}
