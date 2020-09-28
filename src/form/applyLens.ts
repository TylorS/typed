import { map } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'
import { Lens } from 'monocle-ts'

import { CurrentState } from './CurrentState'

export const applyLens = curry(
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...CurrentState<A>, ...B],
    lens: Lens<A, C>,
  ): readonly [...CurrentState<C>, ...B] => {
    const [a, updateA, ...b] = state

    return [
      lens.get(a),
      (updateC) =>
        map(
          lens.get,
          updateA((a) => pipe(a, lens.get, updateC, (c) => lens.set(c)(a))),
        ),
      ...b,
    ]
  },
) as {
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...CurrentState<A>, ...B],
    lens: Lens<A, C>,
  ): readonly [...CurrentState<C>, ...B]

  <A, B extends ReadonlyArray<any>>(state: readonly [...CurrentState<A>, ...B]): <C>(
    lens: Lens<A, C>,
  ) => readonly [...CurrentState<C>, ...B]
}
