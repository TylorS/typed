import { Equals } from 'ts-toolbelt/out/Any/Equals'

import { Fx, Of } from '@/Fx'

export interface Queue<R, E, A, R2 = R, E2 = E, B = A> {
  readonly capacity: number
  readonly size: Of<number>
  readonly isShutdown: Of<boolean>
  readonly shutdown: Of<void>
  readonly enqueue: (
    ...values: readonly A[]
  ) => Fx<R, E, Equals<A, never> extends 1 ? false : boolean>
  readonly dequeue: Fx<R2, E2, Equals<B, never> extends 1 ? [] : readonly B[]>
  readonly dequeueAll: Fx<R2, E2, Equals<B, never> extends 1 ? [] : readonly B[]>
  readonly dequeueUpTo: (
    amount: number,
  ) => Fx<R2, E2, Equals<B, never> extends 1 ? [] : readonly B[]>
}

/**
 * A queue that can only be enqueued.
 */
export interface Enqueue<R, E, A>
  extends Omit<Queue<R, E, A, unknown, never, never>, 'dequeue' | 'dequeueAll' | 'dequeueUpTo'> {}

/**
 * A queue that can only be dequeued.
 */
export interface Dequeue<R, E, A> extends Omit<Queue<unknown, never, never, R, E, A>, 'enqueue'> {
  readonly enqueue: never
}
