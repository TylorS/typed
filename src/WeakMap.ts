import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'

export const lookup =
  (key: object) =>
  <A>(weakMap: WeakMap<object, A>): O.Option<A> =>
    weakMap.has(key) ? O.some(weakMap.get(key)!) : O.none

export const deleteAt =
  (key: object) =>
  <A>(weakMap: WeakMap<object, A>): O.Option<WeakMap<object, A>> =>
    pipe(
      weakMap,
      O.fromPredicate((m) => m.delete(key)),
      O.chain((deleted) => (deleted ? O.some(weakMap) : O.none)),
    )
