import * as R from '@fp/Resume'
import { none, Option, some } from 'fp-ts/Option'

/**
 * A simple representation of a Queue
 */
export interface Queue<A> {
  readonly enqueue: (...values: ReadonlyArray<A>) => R.Resume<void>
  readonly enqueueFirst: (...values: ReadonlyArray<A>) => R.Resume<void>
  readonly dequeue: R.Resume<Option<A>>
  readonly peek: R.Resume<Option<A>>
}

/**
 * Creates a synchronous in-memory queue
 */
export function createQueue<A>(initial: ReadonlyArray<A> = []): Queue<A> {
  const queue = [...initial]

  function enqueue(...values: ReadonlyArray<A>) {
    return R.sync(() => queue.push(...values))
  }

  function enqueueFirst(...values: ReadonlyArray<A>) {
    return R.sync(() => queue.unshift(...values))
  }

  const dequeue = R.sync<Option<A>>(() => (queue.length > 0 ? some(queue.shift()!) : none))

  const peek = R.sync(() => {
    return queue.length > 0 ? some(queue[0]) : none
  })

  return {
    enqueue,
    enqueueFirst,
    dequeue,
    peek,
  }
}

/**
 * Creates a synchronous in-memory stack
 */
export function createStack<A>(initial: ReadonlyArray<A> = []): Queue<A> {
  const queue = createQueue(initial)

  return { ...queue, enqueue: queue.enqueueFirst, enqueueFirst: queue.enqueue }
}
