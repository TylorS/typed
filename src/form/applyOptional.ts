import { map } from '@typed/fp/Effect/exports'
import { UseState } from '@typed/fp/hooks/exports'
import { curry } from '@typed/fp/lambda/exports'
import { constant, pipe } from 'fp-ts/function'
import { fold, Option } from 'fp-ts/Option'
import { Optional } from 'monocle-ts'

export const applyOptional = curry(
  <A, B>(state: UseState<A>, optional: Optional<A, B>): UseState<Option<B>> => {
    const [getA, updateA] = state

    return [
      map(optional.getOption, getA),
      (updateB) =>
        map(
          optional.getOption,
          updateA((a) =>
            pipe(
              a,
              optional.getOption,
              updateB,
              fold(constant(a), (b) => optional.set(b)(a)),
            ),
          ),
        ),
    ]
  },
) as {
  <A, B>(state: UseState<A>, optional: Optional<A, B>): UseState<Option<B>>
  <A>(state: UseState<A>): <B>(optional: Optional<A, B>) => UseState<Option<B>>
}
