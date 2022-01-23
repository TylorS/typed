import { Disposable } from '@/Disposable'
import { Exit } from '@/Exit'
import { Of } from '@/Fx'

export type Fiber<E, A> = RuntimeFiber<E, A> | SyntheticFiber<E, A>

export interface RuntimeFiber<E, A> extends Disposable {
  readonly type: 'RuntimeFiber'
  readonly status: Of<Status>
  readonly exit: Of<Exit<E, A>>
  readonly inheritRefs: Of<void>
}

export interface SyntheticFiber<E, A> extends Disposable {
  readonly type: 'SyntheticFiber'
  readonly status: Of<Status>
  readonly exit: Of<Exit<E, A>>
  readonly inheritRefs: Of<void>
}

export type Status = Suspended | Running | Failed | Completed

export type Suspended = {
  readonly type: 'Suspended'
  readonly isInterruptible: boolean
}

export type Running = {
  readonly type: 'Running'
  readonly isInterruptible: boolean
}

export type Failed = {
  readonly type: 'Failed'
}

export type Completed = {
  readonly type: 'Completed'
}
