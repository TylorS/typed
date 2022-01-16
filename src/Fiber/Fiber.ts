import { Exit } from '@/Exit'
import { Of } from '@/Fx'

export type Fiber<E, A> = RuntimeFiber<E, A> | SyntheticFiber<E, A>

export interface RuntimeFiber<E, A> {
  readonly type: 'RuntimeFiber'
  readonly exit: Of<Exit<E, A>>
}

export interface SyntheticFiber<E, A> {
  readonly type: 'SyntheticFiber'
  readonly exit: Of<Exit<E, A>>
}
