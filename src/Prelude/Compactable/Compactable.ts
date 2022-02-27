import { HKT, HKT2, HKT3, HKT4, HKT5, HKT6, HKT7, HKT8, HKT9, HKT10 } from '@/Prelude/HKT'

import {
  Compact,
  Compact1,
  Compact2,
  Compact3,
  Compact4,
  Compact5,
  Compact6,
  Compact7,
  Compact8,
  Compact9,
  Compact10,
} from '../Compact'
import {
  Separate,
  Separate1,
  Separate2,
  Separate3,
  Separate4,
  Separate5,
  Separate6,
  Separate7,
  Separate8,
  Separate9,
  Separate10,
} from '../Separate'

export interface Compactable<T extends HKT> extends Compact<T>, Separate<T> {}

export interface Compactable1<T extends HKT> extends Compact1<T>, Separate1<T> {}

export interface Compactable2<T extends HKT2> extends Compact2<T>, Separate2<T> {}

export interface Compactable3<T extends HKT3> extends Compact3<T>, Separate3<T> {}

export interface Compactable4<T extends HKT4> extends Compact4<T>, Separate4<T> {}

export interface Compactable5<T extends HKT5> extends Compact5<T>, Separate5<T> {}

export interface Compactable6<T extends HKT6> extends Compact6<T>, Separate6<T> {}

export interface Compactable7<T extends HKT7> extends Compact7<T>, Separate7<T> {}

export interface Compactable8<T extends HKT8> extends Compact8<T>, Separate8<T> {}

export interface Compactable9<T extends HKT9> extends Compact9<T>, Separate9<T> {}

export interface Compactable10<T extends HKT10> extends Compact10<T>, Separate10<T> {}
