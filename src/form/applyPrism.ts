import { map } from '@typed/fp/Effect/exports'
import { UseState } from '@typed/fp/hooks/exports'
import { curry } from '@typed/fp/lambda/exports'
import { constant, pipe } from 'fp-ts/function'
import { fold, Option } from 'fp-ts/Option'
import { Prism } from 'monocle-ts'

export const applyPrism = curry(
  <A, B>(state: UseState<A>, prism: Prism<A, B>): UseState<Option<B>> => {
    const [getA, updateA] = state

    return [
      map(prism.getOption, getA),
      (updateB) =>
        map(
          prism.getOption,
          updateA((a) => pipe(a, prism.getOption, updateB, fold(constant(a), prism.reverseGet))),
        ),
    ]
  },
) as {
  <A, B>(state: UseState<A>, prism: Prism<A, B>): UseState<Option<B>>
  <A>(state: UseState<A>): <B>(prism: Prism<A, B>) => UseState<Option<B>>
}
