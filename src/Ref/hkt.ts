import { HKT4, Params } from '@/Prelude/HKT'

import { Ref } from './Ref'

export interface RefHKT extends HKT4 {
  readonly type: Ref<this[Params.S], this[Params.R], this[Params.E], this[Params.A]>
}
