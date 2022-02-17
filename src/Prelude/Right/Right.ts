import { HKT, Params } from '@/Prelude/HKT'

export interface Right<A> {
  readonly type: 'Right'
  readonly value: A
}

export const Right = <A>(value: A): Right<A> => ({
  type: 'Right',
  value,
})

export interface RightHKT extends HKT {
  readonly type: Right<this[Params.A]>
}
