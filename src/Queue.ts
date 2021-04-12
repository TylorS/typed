import * as R from '@fp/Resume'
import { none, Option, some } from 'fp-ts/Option'

/**
 * A synchronous, likely in-memory, representation of a Queue.
 */
export interface Queue<A> {
  readonly enqueue: (...values: ReadonlyArray<A>) => R.Resume<void>
  readonly dequeue: R.Resume<Option<A>>
  readonly dequeueAll: R.Resume<ReadonlyArray<A>>
  readonly peek: R.Resume<Option<A>>
  readonly some: (f: (value: A) => boolean) => R.Resume<boolean>
  readonly modify: (f: (queue: ReadonlyArray<A>) => ReadonlyArray<A>) => R.Resume<ReadonlyArray<A>>
}

/**
 * Creates a synchronous in-memory queue
 */
export function createQueue<A>(initial: ReadonlyArray<A> = []): Queue<A> {
  let queue = [...initial]

  function enqueue(...values: ReadonlyArray<A>) {
    return R.sync(() => queue.push(...values))
  }

  const dequeue = R.sync<Option<A>>(() => (queue.length > 0 ? some(queue.shift()!) : none))

  const dequeueAll = R.sync(() => {
    const q = queue.slice()

    queue = []

    return q
  })

  const peek = R.sync(() => {
    return queue.length > 0 ? some(queue[0]) : none
  })

  function modify(f: (array: ReadonlyArray<A>) => ReadonlyArray<A>) {
    return R.sync(() => {
      const updated = f(queue)

      queue = updated.slice()

      return updated
    })
  }

  return {
    enqueue,
    dequeue,
    dequeueAll,
    peek,
    modify,
    some: (f) => R.sync(() => queue.some(f)),
  }
}

/**
 * Creates a synchronous in-memory stack
 */
export function createStack<A>(initial: ReadonlyArray<A> = []): Queue<A> {
  let queue = [...initial]

  function enqueue(...values: ReadonlyArray<A>) {
    return R.sync(() => queue.unshift(...values))
  }

  const dequeue = R.sync<Option<A>>(() => (queue.length > 0 ? some(queue.shift()!) : none))

  const dequeueAll = R.sync(() => {
    const q = queue.slice()

    queue = []

    return q
  })

  const peek = R.sync(() => {
    return queue.length > 0 ? some(queue[0]) : none
  })

  function modify(f: (array: ReadonlyArray<A>) => ReadonlyArray<A>) {
    return R.sync(() => {
      const updated = f(queue)

      queue = updated.slice()

      return updated
    })
  }

  return {
    enqueue,
    dequeue,
    dequeueAll,
    peek,
    modify,
    some: (f) => R.sync(() => queue.some(f)),
  }
}
