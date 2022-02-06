import { Alt } from '@/Alt'
import { Applicative } from '@/Applicative'
import { HKT } from '@/HKT'
import { Zero } from '@/Zero'

export interface Alternative<T extends HKT> extends Applicative<T>, Alt<T>, Zero<T> {}
