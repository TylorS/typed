import { Chain } from '@/Chain'
import { HKT } from '@/HKT'
import { Pointed } from '@/Pointed'

export interface Monad<T extends HKT> extends Chain<T>, Pointed<T> {}
