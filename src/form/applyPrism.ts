import { map } from '@typed/fp/Effect/exports'
import { UseState } from '@typed/fp/hooks/exports'
import { curry } from '@typed/fp/lambda/exports'
import { constant, pipe } from 'fp-ts/function'
import { fold, Option } from 'fp-ts/Option'
import { Prism } from 'monocle-ts'

export const applyPrism = curry(
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...UseState<A>, ...B],
    prism: Prism<A, C>,
  ): readonly [...UseState<Option<C>>, ...B] => {
    const [getA, updateA, ...b] = state

    return [
      map(prism.getOption, getA),
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
    state: readonly [...UseState<A>, ...B],
    prism: Prism<A, C>,
  ): readonly [...UseState<Option<C>>, ...B]

  <A, B extends ReadonlyArray<any>>(state: readonly [...UseState<A>, ...B]): <C>(
    prism: Prism<A, C>,
  ) => readonly [...UseState<Option<C>>, ...B]
}
