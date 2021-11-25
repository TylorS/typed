import { Pure } from '@/Effect'
import { Exit } from '@/Exit'

export type Fiber<E, A> = ScopedFiber<E, A> | SyntheticFiber<E, A>

export interface ScopedFiber<E, A> {
  readonly type: 'Scoped'
  readonly exit: Pure<Exit<E, A>>
}

export interface SyntheticFiber<E, A> {
  readonly type: 'Synthetic'
  readonly exit: Pure<Exit<E, A>>
}
