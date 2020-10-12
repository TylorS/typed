import { any } from '@typed/fp/logic/any'
import { complement } from '@typed/fp/logic/exports'
import { Predicate } from 'fp-ts/function'
import { none, some } from 'fp-ts/Option'

import { Queue } from './Queue'

export function createFifoQueue<A>(queue: Array<A>): Queue<A> {
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

  function remove(f: Predicate<A>) {
    queue = queue.filter(complement(f))
  }

  return {
    enqueue,
    dequeue,
    dequeueAll,
    peek,
    some: (f) => any(f, queue),
    remove,
  }
}
