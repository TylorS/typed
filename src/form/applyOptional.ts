import { map } from '@typed/fp/Effect/exports'
import { UseState } from '@typed/fp/hooks/exports'
import { curry } from '@typed/fp/lambda/exports'
import { constant, pipe } from 'fp-ts/function'
import { fold, Option } from 'fp-ts/Option'
import { Optional } from 'monocle-ts'

export const applyOptional = curry(
  <A, B extends ReadonlyArray<any>, C>(
    state: readonly [...UseState<A>, ...B],
    optional: Optional<A, C>,
  ): readonly [...UseState<Option<C>>, ...B] => {
    const [getA, updateA, ...b] = state

    return [
      map(optional.getOption, getA),
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
    state: readonly [...UseState<A>, ...B],
    optional: Optional<A, C>,
  ): readonly [...UseState<Option<C>>, ...B]

  <A, B extends ReadonlyArray<any>>(state: readonly [...UseState<A>, ...B]): <C>(
    optional: Optional<A, C>,
  ) => readonly [...UseState<Option<C>>, ...B]
}
