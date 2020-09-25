import { map } from '@typed/fp/Effect/exports'
import { UseState } from '@typed/fp/hooks/exports'
import { curry } from '@typed/fp/lambda/exports'
import { flow } from 'fp-ts/function'
import { Iso } from 'monocle-ts'

export const applyIso = curry(
  <A, B>(state: UseState<A>, iso: Iso<A, B>): UseState<B> => {
    const [getA, updateA] = state

    return [
      map(iso.get, getA),
      (updateB) => map(iso.get, updateA(flow(iso.get, updateB, iso.reverseGet))),
    ]
  },
) as {
  <A, B>(state: UseState<A>, iso: Iso<A, B>): UseState<B>
  <A>(state: UseState<A>): <B>(iso: Iso<A, B>) => UseState<B>
}
