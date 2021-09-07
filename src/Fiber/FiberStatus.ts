import { Cause } from '@/Cause'

export type FiberStatus<E, A> = Failed<E> | Completed<A> | Finishing | Running | Suspended<E, A>

export interface Failed<E> {
  readonly _tag: 'Failed'
  readonly cause: Cause<E>
}

export interface Completed<A> {
  readonly _tag: 'Completed'
  readonly value: A
}

export interface Finishing {
  readonly _tag: 'Finishing'
  readonly interrupting: boolean
  readonly interruptible: boolean
}

export interface Running {
  readonly _tag: 'Running'
  readonly interrupting: boolean
  readonly interruptible: boolean
}

export interface Suspended<E, A> {
  readonly _tag: 'Suspended'
  readonly previous: FiberStatus<E, A>
  readonly interruptible: boolean
}
