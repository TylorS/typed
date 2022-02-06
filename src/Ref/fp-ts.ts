import * as F from '@/Functor'
import { HKT, Params } from '@/HKT'

import { map } from './map'
import { Ref } from './Ref'

export interface RefHKT extends HKT {
  readonly type: Ref<this[Params.S], this[Params.R], this[Params.E], this[Params.A]>
}

export const Functor: F.Functor<RefHKT> = {
  map,
}
