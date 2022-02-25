import * as C from '@/Prelude/Covariant'
import { Unary } from '@/Prelude/function'
import { HKT, Params } from '@/Prelude/HKT'

export interface ReadonlyArrayHKT extends HKT {
  readonly type: ReadonlyArray<this[Params.A]>
}

export const map =
  <A, B>(f: Unary<A, B>) =>
  (array: ReadonlyArray<A>): ReadonlyArray<B> => {
    const next: B[] = Array(array.length)

    for (let i = 0; i < array.length; ++i) {
      next[i] = f(array[i])
    }

    return next
  }

export const Covariant: C.Covariant1<ReadonlyArrayHKT> = {
  map,
}

export const size = <A>(array: ReadonlyArray<A>) => array.length
