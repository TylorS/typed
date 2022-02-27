import { HKT, HKT2, HKT3, HKT4, HKT5, HKT6, HKT7, HKT8, HKT9, HKT10 } from '@/Prelude/HKT'

import {
  AssociativeBoth,
  AssociativeBoth1,
  AssociativeBoth2,
  AssociativeBoth3,
  AssociativeBoth4,
  AssociativeBoth5,
  AssociativeBoth6,
  AssociativeBoth7,
  AssociativeBoth8,
  AssociativeBoth9,
  AssociativeBoth10,
} from '../AssociativeBoth'
import {
  Covariant,
  Covariant1,
  Covariant2,
  Covariant3,
  Covariant4,
  Covariant5,
  Covariant6,
  Covariant7,
  Covariant8,
  Covariant9,
  Covariant10,
} from '../Covariant'

export interface Apply<T extends HKT> extends Covariant<T>, AssociativeBoth<T> {}
export interface Apply1<T extends HKT> extends Covariant1<T>, AssociativeBoth1<T> {}
export interface Apply2<T extends HKT2> extends Covariant2<T>, AssociativeBoth2<T> {}
export interface Apply3<T extends HKT3> extends Covariant3<T>, AssociativeBoth3<T> {}
export interface Apply4<T extends HKT4> extends Covariant4<T>, AssociativeBoth4<T> {}
export interface Apply5<T extends HKT5> extends Covariant5<T>, AssociativeBoth5<T> {}
export interface Apply6<T extends HKT6> extends Covariant6<T>, AssociativeBoth6<T> {}
export interface Apply7<T extends HKT7> extends Covariant7<T>, AssociativeBoth7<T> {}
export interface Apply8<T extends HKT8> extends Covariant8<T>, AssociativeBoth8<T> {}
export interface Apply9<T extends HKT9> extends Covariant9<T>, AssociativeBoth9<T> {}
export interface Apply10<T extends HKT10> extends Covariant10<T>, AssociativeBoth10<T> {}
