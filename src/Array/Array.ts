import { HKT, Params } from '@/HKT'

export interface ArrayHKT extends HKT {
  readonly type: Array<this[Params.A]>
}
