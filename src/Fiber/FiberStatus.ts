import { Cause } from '@/Cause'

export type FiberStatus<E, A> = Running | Failed<E> | Completed<A>

export interface Running {
  readonly _tag: 'Running'
  readonly interrupting: boolean
  readonly interruptible: boolean
}

export interface Failed<E> {
  readonly _tag: 'Failed'
  readonly cause: Cause<E>
}

export interface Completed<A> {
  readonly _tag: 'Completed'
  readonly value: A
}
