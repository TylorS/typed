import { Disposable } from '@/Disposable'
import { Exit } from '@/Exit'
import { Of } from '@/Fx'

export type Fiber<E, A> = RuntimeFiber<E, A> | SyntheticFiber<E, A>

export interface RuntimeFiber<E, A> extends Disposable {
  readonly type: 'RuntimeFiber'
  readonly exit: Of<Exit<E, A>>
  readonly inheritRefs: Of<void>
}

export interface SyntheticFiber<E, A> extends Disposable {
  readonly type: 'SyntheticFiber'
  readonly exit: Of<Exit<E, A>>
  readonly inheritRefs: Of<void>
}
