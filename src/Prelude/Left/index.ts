import { HKT, Params } from '@/Prelude/HKT'

export interface Left<A> {
  readonly type: 'Left'
  readonly value: A
}

export const Left = <A>(value: A): Left<A> => ({
  type: 'Left',
  value,
})

export interface LeftHKT extends HKT {
  readonly type: Left<this[Params.A]>
}
