import { HKT, HKT2, HKT3, HKT4, HKT5, HKT6, HKT7, HKT8, HKT9, HKT10 } from '@/Prelude/HKT'

import {
  Apply,
  Apply1,
  Apply2,
  Apply3,
  Apply4,
  Apply5,
  Apply6,
  Apply7,
  Apply8,
  Apply9,
  Apply10,
} from '../Apply'
import {
  Pointed,
  Pointed1,
  Pointed2,
  Pointed3,
  Pointed4,
  Pointed5,
  Pointed6,
  Pointed7,
  Pointed8,
  Pointed9,
  Pointed10,
} from '../Pointed'

export interface Applicative<T extends HKT> extends Apply<T>, Pointed<T> {}
export interface Applicative1<T extends HKT> extends Apply1<T>, Pointed1<T> {}
export interface Applicative2<T extends HKT2> extends Apply2<T>, Pointed2<T> {}
export interface Applicative3<T extends HKT3> extends Apply3<T>, Pointed3<T> {}
export interface Applicative4<T extends HKT4> extends Apply4<T>, Pointed4<T> {}
export interface Applicative5<T extends HKT5> extends Apply5<T>, Pointed5<T> {}
export interface Applicative6<T extends HKT6> extends Apply6<T>, Pointed6<T> {}
export interface Applicative7<T extends HKT7> extends Apply7<T>, Pointed7<T> {}
export interface Applicative8<T extends HKT8> extends Apply8<T>, Pointed8<T> {}
export interface Applicative9<T extends HKT9> extends Apply9<T>, Pointed9<T> {}
export interface Applicative10<T extends HKT10> extends Apply10<T>, Pointed10<T> {}
