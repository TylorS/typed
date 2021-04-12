import { IO } from 'fp-ts/IO'
import { none, Option, some } from 'fp-ts/Option'

/**
 * A synchronous, likely in-memory, representation of a Queue.
 */
export interface Queue<A> {
  readonly enqueue: (...values: ReadonlyArray<A>) => void
  readonly dequeue: IO<Option<A>>
  readonly dequeueAll: IO<ReadonlyArray<A>>
  readonly peek: IO<Option<A>>

  readonly some: (f: (value: A) => boolean) => boolean
  readonly modify: (f: (queue: ReadonlyArray<A>) => ReadonlyArray<A>) => ReadonlyArray<A>
}

export function createQueue<A>(initial: ReadonlyArray<A> = []): Queue<A> {
  let queue = [...initial]

  function enqueue(...values: ReadonlyArray<A>) {
    queue.push(...values)
  }

  function dequeue() {
    return queue.length > 0 ? some(queue.shift()!) : none
  }

  function dequeueAll() {
    const q = queue.slice()

    queue = []

    return q
  }

  function peek() {
    return queue.length > 0 ? some(queue[0]) : none
  }

  function modify(f: (array: ReadonlyArray<A>) => ReadonlyArray<A>) {
    const updated = f(queue)

    queue = updated.slice()

    return updated
  }

  return {
    enqueue,
    dequeue,
    dequeueAll,
    peek,
    modify,
    some: (f) => queue.some(f),
  }
}

export function createStack<A>(initial: ReadonlyArray<A> = []): Queue<A> {
  let queue = [...initial]

  function enqueue(...values: ReadonlyArray<A>) {
    queue.unshift(...values)
  }

  function dequeue() {
    return queue.length > 0 ? some(queue.shift()!) : none
  }

  function dequeueAll() {
    const q = queue.slice()

    queue = []

    return q
  }

  function peek() {
    return queue.length > 0 ? some(queue[0]) : none
  }

  function modify(f: (array: ReadonlyArray<A>) => ReadonlyArray<A>) {
    const updated = f(queue)

    queue = updated.slice()

    return updated
  }

  return {
    enqueue,
    dequeue,
    dequeueAll,
    peek,
    modify,
    some: (f) => queue.some(f),
  }
}
