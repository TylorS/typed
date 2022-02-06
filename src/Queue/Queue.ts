import { Fx, Of } from '@/Fx'
import { Option } from '@/Option'

export interface Queue<R, E, A, R2 = R, E2 = E, B = A> {
  readonly capacity: number
  readonly size: Of<number>
  readonly isShutdown: Of<boolean>
  readonly shutdown: Of<void>
  readonly enqueue: (...values: readonly A[]) => Fx<R, E, boolean>
  readonly poll: Fx<R2, E2, Option<B>>
  readonly dequeue: Fx<R2, E2, B>
  readonly dequeueAll: Fx<R2, E2, readonly B[]>
  readonly dequeueUpTo: (amount: number) => Fx<R2, E2, readonly B[]>
}

/**
 * A queue that can only be enqueued.
 */
export interface Enqueue<R, E, A>
  extends Omit<Queue<R, E, A, unknown, never, never>, 'dequeue' | 'dequeueAll' | 'dequeueUpTo'> {}

/**
 * A queue that can only be dequeued.
 */
export interface Dequeue<R, E, A> extends Omit<Queue<unknown, never, never, R, E, A>, 'enqueue'> {}
