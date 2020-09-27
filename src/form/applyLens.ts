import { map } from '@typed/fp/Effect/exports'
import { UseState } from '@typed/fp/hooks/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'
import { Lens } from 'monocle-ts'

export const applyLens = curry(
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...UseState<A>, ...B],
    lens: Lens<A, C>,
  ): readonly [...UseState<C>, ...B] => {
    const [getA, updateA, ...b] = state

    return [
      map(lens.get, getA),
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
    state: readonly [...UseState<A>, ...B],
    lens: Lens<A, C>,
  ): readonly [...UseState<C>, ...B]

  <A, B extends ReadonlyArray<any>>(state: readonly [...UseState<A>, ...B]): <C>(
    lens: Lens<A, C>,
  ) => readonly [...UseState<C>, ...B]
}
