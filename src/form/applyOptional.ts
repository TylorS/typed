import { map } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { constant, pipe } from 'fp-ts/function'
import { fold, Option } from 'fp-ts/Option'
import { Optional } from 'monocle-ts'

import { CurrentState } from './CurrentState'

/**
 * Apply a Optional to a CurrentState
 */
export const applyOptional = curry(
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...CurrentState<A>, ...B],
    optional: Optional<A, C>,
  ): readonly [...CurrentState<Option<C>>, ...B] => {
    const [a, updateA, ...b] = state

    return [
      optional.getOption(a),
      (updateC) =>
        map(
          optional.getOption,
          updateA((a) =>
            pipe(
              a,
              optional.getOption,
              updateC,
              fold(constant(a), (c) => optional.set(c)(a)),
            ),
          ),
        ),
      ...b,
    ]
  },
) as {
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...CurrentState<A>, ...B],
    optional: Optional<A, C>,
  ): readonly [...CurrentState<Option<C>>, ...B]

  <A, B extends ReadonlyArray<any>>(state: readonly [...CurrentState<A>, ...B]): <C>(
    optional: Optional<A, C>,
  ) => readonly [...CurrentState<Option<C>>, ...B]
}
