import { pipe } from 'fp-ts/function'

import { MutableRef, update } from './MutableRef'

export interface MutableArray<A> extends MutableRef<readonly A[]> {}

export function append<A>(value: A) {
  return (ref: MutableArray<A>): MutableArray<A> => {
    pipe(
      ref,
      update((xs) => [...xs, value]),
    )

    return ref
  }
}

export function remove<A>(value: A) {
  return (ref: MutableArray<A>): MutableArray<A> => {
    pipe(
      ref,
      update((xs) => xs.filter((x) => x !== value)),
    )

    return ref
  }
}
