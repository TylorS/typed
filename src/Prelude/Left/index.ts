import { HKT, Params } from '@/Prelude/HKT'

export interface Left<A> {
  readonly type: 'Left'
  readonly left: A
}

export const Left = <A>(value: A): Left<A> => ({
  type: 'Left',
  left: value,
})

export interface LeftHKT extends HKT {
  readonly type: Left<this[Params.A]>
}
