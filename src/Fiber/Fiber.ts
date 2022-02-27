import { Disposable } from '@/Disposable'
import { Exit } from '@/Exit'
import { FiberId } from '@/FiberId'
import { Of } from '@/Fx'

export type Fiber<E, A> = RuntimeFiber<E, A> | SyntheticFiber<E, A>

export interface RuntimeFiber<E, A> {
  readonly type: 'RuntimeFiber'
  readonly status: Of<Status>
  readonly exit: Of<Exit<E, A>>
  readonly inheritRefs: Of<void>
  readonly dispose: (fiberId: FiberId) => Disposable
}

export interface SyntheticFiber<E, A> {
  readonly type: 'SyntheticFiber'
  readonly status: Of<Status>
  readonly exit: Of<Exit<E, A>>
  readonly inheritRefs: Of<void>
  readonly dispose: (fiberId: FiberId) => Disposable
}

export type Status = Suspended | Running | Failed | Completed

export type Suspended = {
  readonly type: 'Suspended'
  readonly isInterruptible: boolean
}

export const Suspended = (isInterruptible: () => boolean): Suspended => ({
  type: 'Suspended',
  get isInterruptible() {
    return isInterruptible()
  },
})

export type Running = {
  readonly type: 'Running'
  readonly isInterruptible: boolean
}

export const Running = (isInterruptible: () => boolean): Running => ({
  type: 'Running',
  get isInterruptible() {
    return isInterruptible()
  },
})

export const Failed = {
  type: 'Failed',
} as const
export type Failed = typeof Failed

export const Completed = {
  type: 'Completed',
} as const
export type Completed = typeof Completed
