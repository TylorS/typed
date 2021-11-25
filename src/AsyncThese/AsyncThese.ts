import { These } from 'fp-ts/These'

import { Async } from '@/Async'

export interface AsyncThese<E, A> extends Async<These<E, A>> {}
