import { Option } from 'fp-ts/Option'

import { Exit } from '@/Exit'
import { MutableRef } from '@/MutableRef'

export interface Scope<R, E, A> {
  readonly requirements: R
  readonly exit: MutableRef<unknown, never, Option<Exit<E, A>>>
}
