import { Apply } from '@/Apply'
import { HKT } from '@/HKT'
import { Pointed } from '@/Pointed'

export interface Applicative<T extends HKT> extends Apply<T>, Pointed<T> {}
