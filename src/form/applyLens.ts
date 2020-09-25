import { map } from '@typed/fp/Effect/exports'
import { UseState } from '@typed/fp/hooks/exports'
import { curry } from '@typed/fp/lambda/exports'
import { pipe } from 'fp-ts/function'
import { Lens } from 'monocle-ts'

export const applyLens = curry(
  <A, B>(state: UseState<A>, lens: Lens<A, B>): UseState<B> => {
    const [getA, updateA] = state

    return [
      map(lens.get, getA),
      (updateB) =>
        map(
          lens.get,
          updateA((a) => pipe(a, lens.get, updateB, (b) => lens.set(b)(a))),
        ),
    ]
  },
) as {
  <A, B>(state: UseState<A>, lens: Lens<A, B>): UseState<B>
  <A>(state: UseState<A>): <B>(lens: Lens<A, B>) => UseState<B>
}
