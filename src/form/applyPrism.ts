import { map } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { constant, pipe } from 'fp-ts/function'
import { fold, Option } from 'fp-ts/Option'
import { Prism } from 'monocle-ts'

import { CurrentState } from './CurrentState'

/**
 * Apply a Prims to a given piece of state
 */
export const applyPrism = curry(
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...CurrentState<A>, ...B],
    prism: Prism<A, C>,
  ): readonly [...CurrentState<Option<C>>, ...B] => {
    const [a, updateA, ...b] = state

    return [
      prism.getOption(a),
      (updateC) =>
        map(
          prism.getOption,
          updateA((a) => pipe(a, prism.getOption, updateC, fold(constant(a), prism.reverseGet))),
        ),
      ...b,
    ]
  },
) as {
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...CurrentState<A>, ...B],
    prism: Prism<A, C>,
  ): readonly [...CurrentState<Option<C>>, ...B]

  <A, B extends ReadonlyArray<any>>(state: readonly [...CurrentState<A>, ...B]): <C>(
    prism: Prism<A, C>,
  ) => readonly [...CurrentState<Option<C>>, ...B]
}
