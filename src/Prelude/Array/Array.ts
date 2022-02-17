import { HKT, Params } from '@/Prelude/HKT'

export interface ArrayHKT extends HKT {
  readonly type: Array<this[Params.A]>
}
