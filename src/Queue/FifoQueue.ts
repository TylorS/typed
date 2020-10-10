import { none, some } from 'fp-ts/Option'

import { Queue } from './Queue'

export function createFifoQueue<A>(queue: Array<A>): Queue<A> {
  function enqueue(value: A) {
    queue.push(value)
  }

  function dequeue() {
    return queue.length > 0 ? some(queue.shift()!) : none
  }

  function peek() {
    return queue.length > 0 ? some(queue[0]) : none
  }

  return {
    enqueue,
    dequeue,
    peek,
  }
}
