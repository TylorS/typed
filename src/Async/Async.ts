import { Disposable } from '@/Disposable'
import { HKT, Params } from '@/Prelude/HKT'

export interface Async<A> {
  readonly type: 'Async'
  readonly run: (cb: (a: A) => void) => Disposable
}

export interface AsyncHKT extends HKT {
  readonly type: Async<this[Params.A]>
}

export const Async = <A>(run: (cb: (a: A) => void) => Disposable): Async<A> => ({
  type: 'Async',
  run,
})
